package lessons

import (
	"context"
	"errors"
	"fmt"
	"time"

	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/utils"
)

func (a *App) List(ctx context.Context, chapterID, userID string, scope generic.AuthScope) ([]Lesson, error) {
	cacheKey := fmt.Sprintf("lessons:list:chap:%s:u:%s:s:%v", chapterID, userID, scope)

	var cached []Lesson
	if hit, _ := a.Cache.Get(ctx, cacheKey, &cached); hit {
		return cached, nil
	}

	lessons, err := a.ListRepository(ctx, chapterID, userID, scope)
	if err != nil {
		if errors.Is(err, generic.ErrLessonsChapterNotFound) {
			return nil, utils.ErrNotFound("Chapter not found.", err)
		}
		if errors.Is(err, generic.ErrLessonsAccessDenied) {
			return nil, utils.ErrForbidden("Access denied. You do not own this course.", err)
		}
		return nil, utils.ErrInternal("Failed to fetch lessons.", err)
	}

	_ = a.Cache.Set(ctx, cacheKey, lessons, 10*time.Minute)

	return lessons, nil
}

func (a *App) Create(ctx context.Context, userID, chapterID string, req CreateLessonRequest) (*Lesson, error) {
	l, err := a.CreateRepository(ctx, userID, chapterID, req)
	if err != nil {
		if errors.Is(err, generic.ErrLessonsChapterNotFound) {
			return nil, utils.ErrNotFound("Chapter not found.", err)
		}
		if errors.Is(err, generic.ErrLessonsAccessDenied) {
			return nil, utils.ErrForbidden("Access denied. You do not own this course.", err)
		}
		return nil, utils.ErrInternal("Failed to create lesson.", err)
	}

	a.Cache.InvalidateLessons(ctx)

	return l, nil
}

func (a *App) Update(ctx context.Context, id, userID string, req UpdateLessonRequest) (*Lesson, error) {
	l, cleanup, err := a.UpdateRepository(ctx, id, userID, req)
	if err != nil {
		if errors.Is(err, generic.ErrLessonsLessonNotFound) {
			return nil, utils.ErrNotFound("Lesson not found.", err)
		}
		if errors.Is(err, generic.ErrLessonsAccessDenied) {
			return nil, utils.ErrForbidden("Access denied. You do not own this course.", err)
		}
		return nil, utils.ErrInternal("Failed to update lesson.", err)
	}

	if cleanup != nil && a.Storage != nil && req.PreviewVideoURL != nil {
		a.Storage.DeleteIfReplaced(ctx, cleanup.OldPreviewVideoURL, *req.PreviewVideoURL)
	}

	a.Cache.InvalidateLessons(ctx)

	return l, nil
}

func (a *App) Delete(ctx context.Context, id, userID string) (string, error) {
	deletedID, err := a.DeleteRepository(ctx, id, userID)
	if err != nil {
		if errors.Is(err, generic.ErrLessonsLessonNotFound) {
			return "", utils.ErrNotFound("Lesson not found.", err)
		}
		if errors.Is(err, generic.ErrLessonsAccessDenied) {
			return "", utils.ErrForbidden("Access denied. You do not own this course.", err)
		}
		return "", utils.ErrInternal("Failed to delete lesson.", err)
	}

	a.Cache.InvalidateLessons(ctx)

	return deletedID, nil
}

func (a *App) UpsertVideoContent(ctx context.Context, id, userID string, req UpsertVideoContentRequest) (*LessonVideoContent, error) {
	vc, cleanup, err := a.UpsertVideoContentRepository(ctx, id, userID, req)
	if err != nil {
		if errors.Is(err, generic.ErrLessonsLessonNotFound) {
			return nil, utils.ErrNotFound("Lesson not found.", err)
		}
		if errors.Is(err, generic.ErrLessonsAccessDenied) {
			return nil, utils.ErrForbidden("Access denied. You do not own this course.", err)
		}
		return nil, utils.ErrInternal("Failed to update video content.", err)
	}

	if cleanup != nil && a.Storage != nil {
		a.Storage.DeleteIfReplaced(ctx, cleanup.OldVideoURL, req.VideoURL)
	}

	a.Cache.InvalidateLessons(ctx)

	return vc, nil
}

func (a *App) UpsertDocumentContent(ctx context.Context, id, userID, content string) (*LessonDocumentContent, error) {
	dc, err := a.UpsertDocumentContentRepository(ctx, id, userID, content)
	if err != nil {
		if errors.Is(err, generic.ErrLessonsLessonNotFound) {
			return nil, utils.ErrNotFound("Lesson not found.", err)
		}
		if errors.Is(err, generic.ErrLessonsAccessDenied) {
			return nil, utils.ErrForbidden("Access denied. You do not own this course.", err)
		}
		return nil, utils.ErrInternal("Failed to update document content.", err)
	}

	a.Cache.InvalidateLessons(ctx)

	return dc, nil
}

func (a *App) ReadContent(ctx context.Context, lessonID, userID string, scope generic.AuthScope) (*AggregatedLessonContentResponse, error) {
	cacheKey := fmt.Sprintf("lessons:content:id:%s:u:%s:s:%v", lessonID, userID, scope)

	var cached AggregatedLessonContentResponse
	if hit, _ := a.Cache.Get(ctx, cacheKey, &cached); hit {
		return &cached, nil
	}

	resp, err := a.ReadContentRepository(ctx, lessonID, userID, scope)
	if err != nil {
		if errors.Is(err, generic.ErrLessonsLessonNotFound) {
			return nil, utils.ErrNotFound("Lesson not found.", err)
		}
		if errors.Is(err, generic.ErrLessonsNotEnrolled) {
			return nil, utils.ErrForbidden("Access denied. Not enrolled in course.", err)
		}
		return nil, utils.ErrInternal("Failed to fetch lesson content.", err)
	}

	_ = a.Cache.Set(ctx, cacheKey, *resp, 10*time.Minute)

	return resp, nil
}

func (a *App) ReadContentForTutor(ctx context.Context, lessonID, userID string) (*AggregatedLessonContentResponse, error) {
	resp, err := a.ReadContentForTutorRepository(ctx, lessonID, userID)
	if err != nil {
		if errors.Is(err, generic.ErrLessonsLessonNotFound) {
			return nil, utils.ErrNotFound("Lesson not found.", err)
		}
		if errors.Is(err, generic.ErrLessonsAccessDenied) {
			return nil, utils.ErrForbidden("Access denied. You do not own this course.", err)
		}
		return nil, utils.ErrInternal("Failed to fetch lesson content.", err)
	}

	return resp, nil
}

func (a *App) UpdateComplete(ctx context.Context, lessonID, userID string) error {
	if err := a.MarkLessonCompleteRepository(ctx, userID, lessonID); err != nil {
		if errors.Is(err, generic.ErrLessonsLessonNotFound) {
			return utils.ErrNotFound("Lesson not found.", err)
		}
		if errors.Is(err, generic.ErrLessonsNotEnrolled) {
			return utils.ErrForbidden("Access denied. Not enrolled in course.", err)
		}
		return utils.ErrInternal("Failed to mark lesson complete.", err)
	}

	a.Cache.InvalidateLessons(ctx)

	return nil
}

func (a *App) CreateResource(ctx context.Context, lessonID, userID string, req AddResourceRequest) (*LessonResource, error) {
	res, err := a.CreateResourceRepository(ctx, lessonID, userID, req)
	if err != nil {
		if errors.Is(err, generic.ErrLessonsLessonNotFound) {
			return nil, utils.ErrNotFound("Lesson not found.", err)
		}
		if errors.Is(err, generic.ErrLessonsAccessDenied) {
			return nil, utils.ErrForbidden("Access denied. You do not own this course.", err)
		}
		return nil, utils.ErrInternal("Failed to add resource.", err)
	}

	a.Cache.InvalidateLessons(ctx)

	return res, nil
}

func (a *App) DeleteResource(ctx context.Context, resourceID, userID string) (string, error) {
	deletedID, fileURL, err := a.DeleteResourceRepository(ctx, resourceID, userID)
	if err != nil {
		if errors.Is(err, generic.ErrLessonsResourceNotFound) {
			return "", utils.ErrNotFound("Resource not found.", err)
		}
		if errors.Is(err, generic.ErrLessonsAccessDenied) {
			return "", utils.ErrForbidden("Access denied. You do not own this course.", err)
		}
		return "", utils.ErrInternal("Failed to delete resource.", err)
	}

	if a.Storage != nil && fileURL != "" {
		a.Storage.DeleteIfReplaced(ctx, &fileURL, "")
	}

	a.Cache.InvalidateLessons(ctx)

	return deletedID, nil
}

func (a *App) ReadResourcesForTutor(ctx context.Context, lessonID, userID string) ([]LessonResource, error) {
	resources, err := a.ReadResourcesForTutorRepository(ctx, lessonID, userID)
	if err != nil {
		if errors.Is(err, generic.ErrLessonsLessonNotFound) {
			return nil, utils.ErrNotFound("Lesson not found.", err)
		}
		if errors.Is(err, generic.ErrLessonsAccessDenied) {
			return nil, utils.ErrForbidden("Access denied. You do not own this course.", err)
		}
		return nil, utils.ErrInternal("Failed to fetch resources.", err)
	}

	return resources, nil
}

func (a *App) ReadResources(ctx context.Context, lessonID, userID string, scope generic.AuthScope) ([]LessonResource, error) {
	cacheKey := fmt.Sprintf("lessons:resources:id:%s:u:%s:s:%v", lessonID, userID, scope)

	var cached []LessonResource
	if hit, _ := a.Cache.Get(ctx, cacheKey, &cached); hit {
		return cached, nil
	}

	resources, err := a.ReadResourcesRepository(ctx, lessonID, userID, scope)
	if err != nil {
		if errors.Is(err, generic.ErrLessonsLessonNotFound) {
			return nil, utils.ErrNotFound("Lesson not found.", err)
		}
		if errors.Is(err, generic.ErrLessonsNotEnrolled) {
			return nil, utils.ErrForbidden("Access denied. Not enrolled in course.", err)
		}
		return nil, utils.ErrInternal("Failed to fetch resources.", err)
	}

	_ = a.Cache.Set(ctx, cacheKey, resources, 10*time.Minute)

	return resources, nil
}
