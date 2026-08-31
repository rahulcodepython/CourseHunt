package lessons

import (
	"context"
	"errors"
	"fmt"
	"time"

	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/pkg/cache"
	"coursehunt/server/internals/utils"
)

func (a *App) AdminList(ctx context.Context, chapterID string) ([]Lesson, error) {
	cacheKey := fmt.Sprintf("lessons:admin:list:chap:%s", chapterID)

	return cache.Fetch(ctx, a.Cache, cacheKey, 10*time.Minute, func() ([]Lesson, error) {
		lessons, err := a.AdminListRepository(ctx, chapterID)
		if err != nil {
			return nil, utils.ErrInternal("Failed to fetch lessons.", err)
		}
		return lessons, nil
	})
}

func (a *App) TutorList(ctx context.Context, chapterID, userID string) ([]Lesson, error) {
	cacheKey := fmt.Sprintf("lessons:tutor:list:chap:%s:u:%s", chapterID, userID)

	return cache.Fetch(ctx, a.Cache, cacheKey, 10*time.Minute, func() ([]Lesson, error) {
		lessons, err := a.TutorListRepository(ctx, chapterID, userID)
		if err != nil {
			if errors.Is(err, generic.ErrLessonsChapterNotFound) {
				return nil, utils.ErrNotFound("Chapter not found.", err)
			}
			if errors.Is(err, generic.ErrLessonsAccessDenied) {
				return nil, utils.ErrForbidden("Access denied. You do not own this course.", err)
			}
			return nil, utils.ErrInternal("Failed to fetch lessons.", err)
		}
		return lessons, nil
	})
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

	a.Cache.Invalidate(ctx, "lessons:*", "chapters:*", "courses:*")

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

	a.Cache.Invalidate(ctx, "lessons:*", "chapters:*", "courses:*")

	return l, nil
}

func (a *App) Delete(ctx context.Context, id, userID string) (string, error) {
	deletedID, cleanup, err := a.DeleteRepository(ctx, id, userID)
	if err != nil {
		if errors.Is(err, generic.ErrLessonsLessonNotFound) {
			return "", utils.ErrNotFound("Lesson not found.", err)
		}
		if errors.Is(err, generic.ErrLessonsAccessDenied) {
			return "", utils.ErrForbidden("Access denied. You do not own this course.", err)
		}
		return "", utils.ErrInternal("Failed to delete lesson.", err)
	}

	if cleanup != nil && a.Storage != nil {
		if cleanup.OldPreviewVideoURL != nil {
			a.Storage.DeleteIfReplaced(ctx, cleanup.OldPreviewVideoURL, "")
		}
		if cleanup.VideoURL != nil {
			a.Storage.DeleteIfReplaced(ctx, cleanup.VideoURL, "")
		}
		for _, u := range cleanup.ResourceURLs {
			u := u
			a.Storage.DeleteIfReplaced(ctx, &u, "")
		}
	}

	a.Cache.Invalidate(ctx, "lessons:*", "chapters:*", "courses:*")

	return deletedID, nil
}

func (a *App) UpsertVideoContent(ctx context.Context, lessonID, userID string, req UpsertVideoContentRequest) (*LessonVideoContent, error) {
	vc, cleanup, err := a.UpsertVideoContentRepository(ctx, lessonID, userID, req)
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

	a.Cache.Invalidate(ctx, "lessons:*")

	return vc, nil
}

func (a *App) UpsertDocumentContent(ctx context.Context, lessonID, userID, content string) (*LessonDocumentContent, error) {
	dc, err := a.UpsertDocumentContentRepository(ctx, lessonID, userID, content)
	if err != nil {
		if errors.Is(err, generic.ErrLessonsLessonNotFound) {
			return nil, utils.ErrNotFound("Lesson not found.", err)
		}
		if errors.Is(err, generic.ErrLessonsAccessDenied) {
			return nil, utils.ErrForbidden("Access denied. You do not own this course.", err)
		}
		return nil, utils.ErrInternal("Failed to update document content.", err)
	}

	a.Cache.Invalidate(ctx, "lessons:*")

	return dc, nil
}

func (a *App) AdminReadContent(ctx context.Context, lessonID string) (*AggregatedLessonContentResponse, error) {
	cacheKey := fmt.Sprintf("lessons:admin:content:%s", lessonID)

	return cache.Fetch(ctx, a.Cache, cacheKey, 10*time.Minute, func() (*AggregatedLessonContentResponse, error) {
		resp, err := a.AdminReadContentRepository(ctx, lessonID)
		if err != nil {
			if errors.Is(err, generic.ErrLessonsLessonNotFound) {
				return nil, utils.ErrNotFound("Lesson not found.", err)
			}
			return nil, utils.ErrInternal("Failed to fetch lesson content.", err)
		}
		return resp, nil
	})
}

func (a *App) TutorReadContent(ctx context.Context, lessonID, userID string) (*AggregatedLessonContentResponse, error) {
	cacheKey := fmt.Sprintf("lessons:tutor:content:%s:u:%s", lessonID, userID)

	return cache.Fetch(ctx, a.Cache, cacheKey, 10*time.Minute, func() (*AggregatedLessonContentResponse, error) {
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
	})
}

func (a *App) StudentReadContent(ctx context.Context, lessonID, userID string) (*AggregatedLessonContentResponse, error) {
	cacheKey := fmt.Sprintf("lessons:student:content:%s:u:%s", lessonID, userID)

	return cache.Fetch(ctx, a.Cache, cacheKey, 10*time.Minute, func() (*AggregatedLessonContentResponse, error) {
		resp, err := a.StudentReadContentRepository(ctx, lessonID, userID)
		if err != nil {
			if errors.Is(err, generic.ErrLessonsLessonNotFound) {
				return nil, utils.ErrNotFound("Lesson not found.", err)
			}
			if errors.Is(err, generic.ErrLessonsNotEnrolled) {
				return nil, utils.ErrForbidden("Access denied. Not enrolled in this course.", err)
			}
			return nil, utils.ErrInternal("Failed to fetch lesson content.", err)
		}
		return resp, nil
	})
}

func (a *App) UpdateComplete(ctx context.Context, lessonID, userID string) error {
	if err := a.UpdateCompleteRepository(ctx, lessonID, userID); err != nil {
		if errors.Is(err, generic.ErrLessonsLessonNotFound) {
			return utils.ErrNotFound("Lesson not found.", err)
		}
		if errors.Is(err, generic.ErrLessonsNotEnrolled) {
			return utils.ErrForbidden("Access denied. Not enrolled in this course.", err)
		}
		return utils.ErrInternal("Failed to mark lesson complete.", err)
	}

	a.Cache.Invalidate(ctx, "courses:*")

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

	a.Cache.Invalidate(ctx, "lessons:*")

	return res, nil
}

func (a *App) DeleteResource(ctx context.Context, resourceID, userID string) (string, error) {
	deletedID, oldURL, err := a.DeleteResourceRepository(ctx, resourceID, userID)
	if err != nil {
		if errors.Is(err, generic.ErrLessonsResourceNotFound) {
			return "", utils.ErrNotFound("Resource not found.", err)
		}
		if errors.Is(err, generic.ErrLessonsAccessDenied) {
			return "", utils.ErrForbidden("Access denied. You do not own this course.", err)
		}
		return "", utils.ErrInternal("Failed to delete resource.", err)
	}

	if oldURL != nil && a.Storage != nil {
		a.Storage.DeleteIfReplaced(ctx, oldURL, "")
	}

	a.Cache.Invalidate(ctx, "lessons:*")

	return deletedID, nil
}

func (a *App) AdminReadResources(ctx context.Context, lessonID string) ([]LessonResource, error) {
	cacheKey := fmt.Sprintf("lessons:admin:resources:%s", lessonID)

	return cache.Fetch(ctx, a.Cache, cacheKey, 10*time.Minute, func() ([]LessonResource, error) {
		resources, err := a.AdminReadResourcesRepository(ctx, lessonID)
		if err != nil {
			if errors.Is(err, generic.ErrLessonsLessonNotFound) {
				return nil, utils.ErrNotFound("Lesson not found.", err)
			}
			return nil, utils.ErrInternal("Failed to fetch resources.", err)
		}
		return resources, nil
	})
}

func (a *App) TutorReadResources(ctx context.Context, lessonID, userID string) ([]LessonResource, error) {
	cacheKey := fmt.Sprintf("lessons:tutor:resources:%s:u:%s", lessonID, userID)

	return cache.Fetch(ctx, a.Cache, cacheKey, 10*time.Minute, func() ([]LessonResource, error) {
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
	})
}

func (a *App) StudentReadResources(ctx context.Context, lessonID, userID string) ([]LessonResource, error) {
	cacheKey := fmt.Sprintf("lessons:student:resources:%s:u:%s", lessonID, userID)

	return cache.Fetch(ctx, a.Cache, cacheKey, 10*time.Minute, func() ([]LessonResource, error) {
		resources, err := a.StudentReadResourcesRepository(ctx, lessonID, userID)
		if err != nil {
			if errors.Is(err, generic.ErrLessonsLessonNotFound) {
				return nil, utils.ErrNotFound("Lesson not found.", err)
			}
			if errors.Is(err, generic.ErrLessonsNotEnrolled) {
				return nil, utils.ErrForbidden("Access denied. Not enrolled in this course.", err)
			}
			return nil, utils.ErrInternal("Failed to fetch resources.", err)
		}
		return resources, nil
	})
}
