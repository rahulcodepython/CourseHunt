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

type updatesCacheData struct {
	Data  []CourseUpdate `json:"data"`
	Total int            `json:"total"`
}

func (a *App) AdminList(ctx context.Context, page, limit int) ([]CourseUpdate, int, error) {
	cacheKey := fmt.Sprintf("updates:admin:list:p:%d:l:%d", page, limit)

	result, err := cache.Fetch(ctx, a.Cache, cacheKey, 5*time.Minute, func() (updatesCacheData, error) {
		list, total, err := a.AdminListRepository(ctx, page, limit)
		if err != nil {
			return updatesCacheData{}, utils.ErrInternal("Failed to fetch updates.", err)
		}
		return updatesCacheData{Data: list, Total: total}, nil
	})
	if err != nil {
		return nil, 0, err
	}
	return result.Data, result.Total, nil
}

func (a *App) TutorList(ctx context.Context, page, limit int, userID string) ([]CourseUpdate, int, error) {
	cacheKey := fmt.Sprintf("updates:tutor:list:p:%d:l:%d:u:%s", page, limit, userID)

	result, err := cache.Fetch(ctx, a.Cache, cacheKey, 5*time.Minute, func() (updatesCacheData, error) {
		list, total, err := a.TutorListRepository(ctx, page, limit, userID)
		if err != nil {
			return updatesCacheData{}, utils.ErrInternal("Failed to fetch updates.", err)
		}
		return updatesCacheData{Data: list, Total: total}, nil
	})
	if err != nil {
		return nil, 0, err
	}
	return result.Data, result.Total, nil
}

func (a *App) AdminCreate(ctx context.Context, userID string, req CreateUpdateRequest) (*CourseUpdate, error) {
	u, err := a.AdminCreateRepository(ctx, userID, req)
	if err != nil {
		return nil, utils.ErrInternal("Failed to create update.", err)
	}

	a.Cache.Invalidate(ctx, "updates:*")
	return u, nil
}

func (a *App) TutorCreate(ctx context.Context, userID string, req CreateUpdateRequest) (*CourseUpdate, error) {
	u, err := a.TutorCreateRepository(ctx, userID, req)
	if err != nil {
		if errors.Is(err, generic.ErrUpdatesAccessDenied) {
			return nil, utils.ErrForbidden("Access denied. You do not own this course.", err)
		}
		return nil, utils.ErrInternal("Failed to create update.", err)
	}

	a.Cache.Invalidate(ctx, "updates:*")
	return u, nil
}

func (a *App) AdminUpdate(ctx context.Context, id, message string) (*CourseUpdate, error) {
	u, err := a.AdminUpdateRepository(ctx, id, message)
	if err != nil {
		if errors.Is(err, generic.ErrUpdatesNotFound) {
			return nil, utils.ErrNotFound("Update not found.", err)
		}
		return nil, utils.ErrInternal("Failed to update.", err)
	}

	a.Cache.Invalidate(ctx, "updates:*")
	return u, nil
}

func (a *App) TutorUpdate(ctx context.Context, id, message, userID string) (*CourseUpdate, error) {
	u, err := a.TutorUpdateRepository(ctx, id, message, userID)
	if err != nil {
		if errors.Is(err, generic.ErrUpdatesNotFound) {
			return nil, utils.ErrNotFound("Update not found.", err)
		}
		if errors.Is(err, generic.ErrUpdatesAccessDenied) {
			return nil, utils.ErrForbidden("Access denied. You do not own this course update.", err)
		}
		return nil, utils.ErrInternal("Failed to update.", err)
	}

	a.Cache.Invalidate(ctx, "updates:*")
	return u, nil
}

func (a *App) AdminDelete(ctx context.Context, id string) (string, error) {
	deletedID, err := a.AdminDeleteRepository(ctx, id)
	if err != nil {
		if errors.Is(err, generic.ErrUpdatesNotFound) {
			return "", utils.ErrNotFound("Update not found.", err)
		}
		return "", utils.ErrInternal("Failed to delete.", err)
	}

	a.Cache.Invalidate(ctx, "updates:*")
	return deletedID, nil
}

func (a *App) TutorDelete(ctx context.Context, id, userID string) (string, error) {
	deletedID, err := a.TutorDeleteRepository(ctx, id, userID)
	if err != nil {
		if errors.Is(err, generic.ErrUpdatesNotFound) {
			return "", utils.ErrNotFound("Update not found.", err)
		}
		if errors.Is(err, generic.ErrUpdatesAccessDenied) {
			return "", utils.ErrForbidden("Access denied. You do not own this course update.", err)
		}
		return "", utils.ErrInternal("Failed to delete.", err)
	}

	a.Cache.Invalidate(ctx, "updates:*")
	return deletedID, nil
}
