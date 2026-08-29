package feedbacks

import (
	"context"
	"errors"
	"fmt"
	"time"

	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/utils"
)

type feedbacksListCacheData struct {
	Data  []Feedback `json:"data"`
	Total int        `json:"total"`
}

func (a *App) Create(ctx context.Context, userID, courseID string, req CreateFeedbackRequest) (*Feedback, error) {
	f, err := a.CreateRepository(ctx, userID, courseID, req)
	if err != nil {
		if errors.Is(err, generic.ErrFeedbacksNotEnrolled) {
			return nil, utils.ErrForbidden("Access denied. Not enrolled in course.", err)
		}
		return nil, utils.ErrInternal("Failed to post feedback.", err)
	}

	a.Cache.InvalidateFeedbacks(ctx)

	return f, nil
}

func (a *App) List(ctx context.Context, scope generic.AuthScope, userID string, page, limit int, isPinned, userName, userEmail, courseID string) ([]Feedback, int, error) {
	cacheKey := fmt.Sprintf("feedbacks:list:p:%d:l:%d:s:%v:u:%s:pin:%s:c:%s", page, limit, scope, userID, isPinned, courseID)

	var cached feedbacksListCacheData
	if hit, _ := a.Cache.Get(ctx, cacheKey, &cached); hit {
		return cached.Data, cached.Total, nil
	}

	list, total, err := a.ListRepository(ctx, scope, userID, page, limit, isPinned, userName, userEmail, courseID)
	if err != nil {
		return nil, 0, utils.ErrInternal("Failed to fetch feedbacks.", err)
	}

	_ = a.Cache.Set(ctx, cacheKey, feedbacksListCacheData{Data: list, Total: total}, 5*time.Minute)

	return list, total, nil
}

func (a *App) ListPinned(ctx context.Context, page, limit int, courseID string) ([]Feedback, int, error) {
	cacheKey := fmt.Sprintf("feedbacks:pinned:p:%d:l:%d:c:%s", page, limit, courseID)

	var cached feedbacksListCacheData
	if hit, _ := a.Cache.Get(ctx, cacheKey, &cached); hit {
		return cached.Data, cached.Total, nil
	}

	list, total, err := a.ListRepository(ctx, generic.ScopeAdmin, "", page, limit, "true", "", "", courseID)
	if err != nil {
		return nil, 0, utils.ErrInternal("Failed to fetch pinned feedbacks.", err)
	}

	_ = a.Cache.Set(ctx, cacheKey, feedbacksListCacheData{Data: list, Total: total}, 10*time.Minute)

	return list, total, nil
}

func (a *App) Update(ctx context.Context, id string, isPinned bool) (*Feedback, error) {
	f, err := a.UpdateRepository(ctx, id, isPinned)
	if err != nil {
		if errors.Is(err, generic.ErrFeedbacksFeedbackNotFound) {
			return nil, utils.ErrNotFound("Feedback not found.", err)
		}
		return nil, utils.ErrInternal("Failed to update feedback pin status.", err)
	}

	a.Cache.InvalidateFeedbacks(ctx)

	return f, nil
}

func (a *App) Delete(ctx context.Context, id, userID string, scope generic.AuthScope) (string, error) {
	deletedID, err := a.DeleteRepository(ctx, id, userID, scope)
	if err != nil {
		if errors.Is(err, generic.ErrFeedbacksFeedbackNotFound) {
			return "", utils.ErrNotFound("Feedback not found.", err)
		}
		return "", utils.ErrInternal("Failed to delete feedback.", err)
	}

	a.Cache.InvalidateFeedbacks(ctx)

	return deletedID, nil
}
