package feedbacks

import (
	"context"
	"errors"
	"fmt"
	"time"

	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/pkg/cache"
	"coursehunt/server/internals/utils"
)

type feedbackListCacheData struct {
	Data  []Feedback `json:"data"`
	Total int        `json:"total"`
}

func (a *App) Create(ctx context.Context, userID, courseID string, req CreateFeedbackRequest) (*Feedback, error) {
	f, err := a.CreateRepository(ctx, userID, courseID, req)
	if err != nil {
		if errors.Is(err, generic.ErrFeedbacksNotEnrolled) {
			return nil, utils.ErrForbidden("Access denied. Not enrolled in this course.", err)
		}
		return nil, utils.ErrInternal("Failed to create feedback.", err)
	}

	a.Cache.Invalidate(ctx, "feedbacks:*")

	return f, nil
}

func (a *App) ListPinned(ctx context.Context, page, limit int, courseID string) ([]Feedback, int, error) {
	list, total, err := a.ListPinnedRepository(ctx, page, limit, courseID)
	if err != nil {
		return nil, 0, utils.ErrInternal("Failed to fetch pinned feedbacks.", err)
	}
	return list, total, nil
}

func (a *App) AdminList(ctx context.Context, page, limit int, isPinned, userName, userEmail, courseID string) ([]Feedback, int, error) {
	cacheKey := fmt.Sprintf("feedbacks:admin:list:p:%d:l:%d:pin:%s:un:%s:ue:%s:c:%s", page, limit, isPinned, userName, userEmail, courseID)

	result, err := cache.Fetch(ctx, a.Cache, cacheKey, 5*time.Minute, func() (feedbackListCacheData, error) {
		list, total, err := a.AdminListRepository(ctx, page, limit, isPinned, userName, userEmail, courseID)
		if err != nil {
			return feedbackListCacheData{}, utils.ErrInternal("Failed to fetch feedbacks.", err)
		}
		return feedbackListCacheData{Data: list, Total: total}, nil
	})
	if err != nil {
		return nil, 0, err
	}
	return result.Data, result.Total, nil
}

func (a *App) TutorList(ctx context.Context, userID string, page, limit int, isPinned, userName, userEmail, courseID string) ([]Feedback, int, error) {
	cacheKey := fmt.Sprintf("feedbacks:tutor:list:u:%s:p:%d:l:%d:pin:%s:un:%s:ue:%s:c:%s", userID, page, limit, isPinned, userName, userEmail, courseID)

	result, err := cache.Fetch(ctx, a.Cache, cacheKey, 5*time.Minute, func() (feedbackListCacheData, error) {
		list, total, err := a.TutorListRepository(ctx, userID, page, limit, isPinned, userName, userEmail, courseID)
		if err != nil {
			return feedbackListCacheData{}, utils.ErrInternal("Failed to fetch feedbacks.", err)
		}
		return feedbackListCacheData{Data: list, Total: total}, nil
	})
	if err != nil {
		return nil, 0, err
	}
	return result.Data, result.Total, nil
}

func (a *App) AdminUpdate(ctx context.Context, id string, isPinned bool) (*Feedback, error) {
	f, err := a.AdminUpdateRepository(ctx, id, isPinned)
	if err != nil {
		if errors.Is(err, generic.ErrFeedbacksFeedbackNotFound) {
			return nil, utils.ErrNotFound("Feedback not found.", err)
		}
		return nil, utils.ErrInternal("Failed to update feedback.", err)
	}

	a.Cache.Invalidate(ctx, "feedbacks:*")

	return f, nil
}

func (a *App) AdminDelete(ctx context.Context, id string) (string, error) {
	deletedID, err := a.AdminDeleteRepository(ctx, id)
	if err != nil {
		if errors.Is(err, generic.ErrFeedbacksFeedbackNotFound) {
			return "", utils.ErrNotFound("Feedback not found.", err)
		}
		return "", utils.ErrInternal("Failed to delete feedback.", err)
	}

	a.Cache.Invalidate(ctx, "feedbacks:*")

	return deletedID, nil
}

func (a *App) TutorDelete(ctx context.Context, id, userID string) (string, error) {
	deletedID, err := a.TutorDeleteRepository(ctx, id, userID)
	if err != nil {
		if errors.Is(err, generic.ErrFeedbacksFeedbackNotFound) {
			return "", utils.ErrNotFound("Feedback not found.", err)
		}
		if errors.Is(err, generic.ErrCoursesAccessDenied) {
			return "", utils.ErrForbidden("Access denied. You do not own this course.", err)
		}
		return "", utils.ErrInternal("Failed to delete feedback.", err)
	}

	a.Cache.Invalidate(ctx, "feedbacks:*")

	return deletedID, nil
}
