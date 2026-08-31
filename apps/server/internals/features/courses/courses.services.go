package courses

import (
	"context"
	"errors"
	"fmt"
	"net/url"
	"time"

	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/pkg/cache"
	"coursehunt/server/internals/utils"
)

type publicCoursesCacheData struct {
	Cards []CoursePublicResponse `json:"cards"`
	Total int                    `json:"total"`
}

func (a *App) PublicList(ctx context.Context, page, limit int, catID, subID, lvl, search string) ([]CoursePublicResponse, int, error) {
	if len(search) > 200 {
		search = search[:200]
	}

	cacheKey := fmt.Sprintf("courses:public:list:p:%d:l:%d:c:%s:s:%s:lvl:%s:q:%s", page, limit, url.QueryEscape(catID), url.QueryEscape(subID), url.QueryEscape(lvl), url.QueryEscape(search))

	result, err := cache.Fetch(ctx, a.Cache, cacheKey, 5*time.Minute, func() (publicCoursesCacheData, error) {
		cards, total, err := a.PublicListRepository(ctx, page, limit, catID, subID, lvl, search)
		if err != nil {
			return publicCoursesCacheData{}, utils.ErrInternal("Failed to fetch public courses.", err)
		}
		return publicCoursesCacheData{Cards: cards, Total: total}, nil
	})
	if err != nil {
		return nil, 0, err
	}
	return result.Cards, result.Total, nil
}

func (a *App) PublicSingle(ctx context.Context, slug, userID string) (*CourseLandingResponse, error) {
	cacheKey := fmt.Sprintf("courses:public:single:slug:%s:u:%s", slug, userID)

	return cache.Fetch(ctx, a.Cache, cacheKey, 5*time.Minute, func() (*CourseLandingResponse, error) {
		resp, err := a.PublicSingleRepository(ctx, slug, userID)
		if err != nil {
			if errors.Is(err, generic.ErrCoursesCourseNotFound) {
				return nil, utils.ErrNotFound("Course not found.", err)
			}
			return nil, utils.ErrInternal("Failed to fetch course details.", err)
		}
		return resp, nil
	})
}

func (a *App) Study(ctx context.Context, courseID, userID string) (*CourseStudyResponse, error) {
	resp, err := a.StudyMetadataRepository(ctx, courseID, userID)
	if err != nil {
		if errors.Is(err, generic.ErrCoursesCourseNotFound) {
			return nil, utils.ErrNotFound("Course not found.", err)
		}
		if errors.Is(err, generic.ErrCoursesNotEnrolled) {
			return nil, utils.ErrForbidden("Access denied. Not enrolled in this course.", err)
		}
		return nil, utils.ErrInternal("Failed to fetch study page.", err)
	}
	return resp, nil
}

func (a *App) EnrollFree(ctx context.Context, userID, courseID string) error {
	if err := a.EnrollFreeRepository(ctx, userID, courseID); err != nil {
		if errors.Is(err, generic.ErrCoursesCourseNotFound) {
			return utils.ErrNotFound("Course not found.", err)
		}
		if errors.Is(err, generic.ErrCoursesNotFree) {
			return utils.ErrBadRequest("This course is not free.", err)
		}
		return utils.ErrInternal("Failed to enroll in course.", err)
	}
	return nil
}

func (a *App) EnrolledList(ctx context.Context, userID string, page, limit int) ([]EnrolledCourseResponse, int, error) {
	list, total, err := a.EnrolledCoursesRepository(ctx, userID, page, limit)
	if err != nil {
		return nil, 0, utils.ErrInternal("Failed to fetch enrolled courses.", err)
	}
	return list, total, nil
}

// --- Admin Services ---

func (a *App) AdminList(ctx context.Context, page, limit int, categoryID, subcategoryID, level, search, status, filterTutorID string) ([]Course, int, error) {
	list, total, err := a.AdminListRepository(ctx, page, limit, categoryID, subcategoryID, level, search, status, filterTutorID)
	if err != nil {
		return nil, 0, utils.ErrInternal("Failed to fetch courses.", err)
	}
	return list, total, nil
}

func (a *App) AdminGetByID(ctx context.Context, id string) (*Course, error) {
	course, err := a.AdminGetByIDRepository(ctx, id)
	if err != nil {
		if errors.Is(err, generic.ErrCoursesCourseNotFound) {
			return nil, utils.ErrNotFound("Course not found.", err)
		}
		return nil, utils.ErrInternal("Failed to fetch course.", err)
	}
	return course, nil
}

// --- Tutor Services ---

func (a *App) TutorList(ctx context.Context, page, limit int, userID, categoryID, subcategoryID, level, search, status string) ([]Course, int, error) {
	list, total, err := a.TutorListRepository(ctx, page, limit, userID, categoryID, subcategoryID, level, search, status)
	if err != nil {
		return nil, 0, utils.ErrInternal("Failed to fetch courses.", err)
	}
	return list, total, nil
}

func (a *App) TutorGetByID(ctx context.Context, id, userID string) (*Course, error) {
	course, err := a.TutorGetByIDRepository(ctx, id, userID)
	if err != nil {
		if errors.Is(err, generic.ErrCoursesCourseNotFound) {
			return nil, utils.ErrNotFound("Course not found.", err)
		}
		if errors.Is(err, generic.ErrCoursesAccessDenied) {
			return nil, utils.ErrForbidden("Access denied. You do not own this course.", err)
		}
		return nil, utils.ErrInternal("Failed to fetch course.", err)
	}
	return course, nil
}

func (a *App) Create(ctx context.Context, userID string, req CreateCourseRequest) (*Course, error) {
	if req.IsFree {
		req.FinalPrice = 0
		req.CouponAllowed = false
	}

	resp, err := a.CreateRepository(ctx, userID, req)
	if err != nil {
		return nil, utils.ErrInternal("Failed to create course.", err)
	}

	a.Cache.Invalidate(ctx, "courses:*")

	return resp, nil
}

func (a *App) Update(ctx context.Context, id, userID string, req UpdateCourseRequest) (*Course, error) {
	if req.IsFree != nil && *req.IsFree {
		zero := 0.0
		req.FinalPrice = &zero
		notAllowed := false
		req.CouponAllowed = &notAllowed
	}

	course, cleanup, err := a.UpdateRepository(ctx, id, userID, req)
	if err != nil {
		if errors.Is(err, generic.ErrCoursesCourseNotFound) {
			return nil, utils.ErrNotFound("Course not found.", err)
		}
		if errors.Is(err, generic.ErrCoursesAccessDenied) {
			return nil, utils.ErrForbidden("Access denied. You do not own this course.", err)
		}
		return nil, utils.ErrInternal("Failed to update course.", err)
	}

	if cleanup != nil && a.Storage != nil {
		if req.ImageURL != nil {
			a.Storage.DeleteIfReplaced(ctx, cleanup.OldImageURL, *req.ImageURL)
		}
		if req.PreviewVideoURL != nil {
			a.Storage.DeleteIfReplaced(ctx, cleanup.OldPreviewVideoURL, *req.PreviewVideoURL)
		}
	}

	a.Cache.Invalidate(ctx, "courses:*")

	return course, nil
}

func (a *App) Delete(ctx context.Context, id, userID string) (string, error) {
	deletedID, err := a.DeleteRepository(ctx, id, userID)
	if err != nil {
		if errors.Is(err, generic.ErrCoursesCourseNotFound) {
			return "", utils.ErrNotFound("Course not found.", err)
		}
		if errors.Is(err, generic.ErrCoursesAccessDenied) {
			return "", utils.ErrForbidden("Access denied. You do not own this course.", err)
		}
		return "", utils.ErrInternal("Failed to delete course.", err)
	}

	a.Cache.Invalidate(ctx, "courses:*")

	return deletedID, nil
}
