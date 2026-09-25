package discussions

import (
	"context"

	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/utils"
)

func (a *App) List(ctx context.Context, lessonID, parentID, userID string, scope generic.AuthScope, page, limit int) ([]Discussion, int, error) {
	list, total, err := a.ListRepository(ctx, lessonID, parentID, userID, scope, page, limit)
	if err != nil {
		return nil, 0, mapDiscussionError(err)
	}
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
	return d, nil
}

func (a *App) Delete(ctx context.Context, id, userID string, scope generic.AuthScope) (string, error) {
	deletedID, err := a.DeleteRepository(ctx, id, userID, scope)
	if err != nil {
		return "", mapDiscussionError(err)
	}
	return deletedID, nil
}
