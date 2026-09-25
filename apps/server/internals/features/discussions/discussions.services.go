package discussions

import (
	"context"
	"fmt"
	"time"

	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/utils"
)

type cachedDiscussionsList struct {
	Data  []Discussion `json:"data"`
	Total int          `json:"total"`
}

func (a *App) List(ctx context.Context, lessonID, parentID, userID string, scope generic.AuthScope, page, limit int) ([]Discussion, int, error) {
	cacheKey := fmt.Sprintf("discussions:l:%s:par:%s:p:%d:lim:%d:sc:%s", lessonID, parentID, page, limit, scope)
	var cached cachedDiscussionsList
	if hit, _ := a.Cache.Get(ctx, cacheKey, &cached); hit {
		return cached.Data, cached.Total, nil
	}

	list, total, err := a.ListRepository(ctx, lessonID, parentID, userID, scope, page, limit)
	if err != nil {
		return nil, 0, mapDiscussionError(err)
	}

	_ = a.Cache.Set(ctx, cacheKey, cachedDiscussionsList{Data: list, Total: total}, 30*time.Second)
	return list, total, nil
}

func (a *App) Create(ctx context.Context, userID string, req CreateDiscussionRequest, scope generic.AuthScope) (*Discussion, error) {
	sanitized := utils.SanitizeUGC(req.Content)
	if sanitized == "" {
		return nil, utils.ErrBadRequest("Discussion content cannot be empty after sanitization.", nil)
	}
	req.Content = sanitized

	d, err := a.CreateRepository(ctx, userID, req, scope)
	if err != nil {
		return nil, mapDiscussionError(err)
	}

	a.Cache.Invalidate(ctx, fmt.Sprintf("discussions:l:%s*", req.LessonID))
	return d, nil
}

func (a *App) Update(ctx context.Context, id, userID string, req UpdateDiscussionRequest, scope generic.AuthScope) (*Discussion, error) {
	sanitized := utils.SanitizeUGC(req.Content)
	if sanitized == "" {
		return nil, utils.ErrBadRequest("Discussion content cannot be empty after sanitization.", nil)
	}
	req.Content = sanitized

	d, err := a.UpdateRepository(ctx, id, userID, req.Content, scope)
	if err != nil {
		return nil, mapDiscussionError(err)
	}

	a.Cache.Invalidate(ctx, fmt.Sprintf("discussions:l:%s*", d.LessonID))
	return d, nil
}

func (a *App) Delete(ctx context.Context, id, userID string, scope generic.AuthScope) (string, error) {
	deletedID, err := a.DeleteRepository(ctx, id, userID, scope)
	if err != nil {
		return "", mapDiscussionError(err)
	}

	a.Cache.Invalidate(ctx, "discussions:*")
	return deletedID, nil
}
