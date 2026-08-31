package updates

import (
	"context"
	"errors"
	"fmt"
	"time"

	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/pkg/cache"
	"coursehunt/server/internals/utils"
)

type updatesListCacheData struct {
	Data  []CourseUpdate `json:"data"`
	Total int            `json:"total"`
}

func (a *App) Create(ctx context.Context, createdBy string, req CreateUpdateRequest, scope generic.AuthScope) (*CourseUpdate, error) {
	u, err := a.CreateRepository(ctx, createdBy, req, scope)
	if err != nil {
		if errors.Is(err, generic.ErrUpdatesAccessDenied) {
			return nil, utils.ErrForbidden("Access denied. You can only create updates for your own courses.", err)
		}
		return nil, utils.ErrInternal("Failed to create update.", err)
	}

	a.Cache.Invalidate(ctx, "updates:*")

	return u, nil
}

func (a *App) Update(ctx context.Context, id, message, userID string, scope generic.AuthScope) (*CourseUpdate, error) {
	u, err := a.UpdateRepository(ctx, id, message, userID, scope)
	if err != nil {
		if errors.Is(err, generic.ErrUpdatesNotFound) {
			return nil, utils.ErrNotFound("Update not found.", err)
		}
		if errors.Is(err, generic.ErrUpdatesAccessDenied) {
			return nil, utils.ErrForbidden("Access denied. You can only modify updates for your own courses.", err)
		}
		return nil, utils.ErrInternal("Failed to modify update.", err)
	}

	a.Cache.Invalidate(ctx, "updates:*")

	return u, nil
}

func (a *App) Delete(ctx context.Context, id, userID string, scope generic.AuthScope) (string, error) {
	id, err := a.DeleteRepository(ctx, id, userID, scope)
	if err != nil {
		if errors.Is(err, generic.ErrUpdatesNotFound) {
			return "", utils.ErrNotFound("Update not found.", err)
		}
		if errors.Is(err, generic.ErrUpdatesAccessDenied) {
			return "", utils.ErrForbidden("Access denied. You can only delete updates for your own courses.", err)
		}
		return "", utils.ErrInternal("Failed to delete update.", err)
	}

	a.Cache.Invalidate(ctx, "updates:*")

	return id, nil
}

func (a *App) Feed(ctx context.Context, userID string, page, limit int) (*UpdateFeedResponse, error) {
	cacheKey := fmt.Sprintf("updates:feed:u:%s:p:%d:l:%d", userID, page, limit)

	return cache.Fetch(ctx, a.Cache, cacheKey, 5*time.Minute, func() (*UpdateFeedResponse, error) {
		feed, err := a.FeedRepository(ctx, userID, page, limit)
		if err != nil {
			return nil, utils.ErrInternal("Failed to fetch update feed.", err)
		}
		return feed, nil
	})
}

func (a *App) List(ctx context.Context, page, limit int, userID string, scope generic.AuthScope) ([]CourseUpdate, int, error) {
	cacheKey := fmt.Sprintf("updates:list:s:%s:u:%s:p:%d:l:%d", scope, userID, page, limit)

	result, err := cache.Fetch(ctx, a.Cache, cacheKey, 5*time.Minute, func() (updatesListCacheData, error) {
		list, total, err := a.ListRepository(ctx, page, limit, userID, scope)
		if err != nil {
			return updatesListCacheData{}, utils.ErrInternal("Failed to fetch updates.", err)
		}
		return updatesListCacheData{Data: list, Total: total}, nil
	})
	if err != nil {
		return nil, 0, err
	}
	return result.Data, result.Total, nil
}
