package discussions

import (
	"context"
	"errors"

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
	d, err := a.CreateRepository(ctx, userID, req, scope)
	if err != nil {
		return nil, mapDiscussionError(err)
	}
	return d, nil
}

func (a *App) Update(ctx context.Context, id, userID string, req UpdateDiscussionRequest, scope generic.AuthScope) (*Discussion, error) {
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

func mapDiscussionError(err error) error {
	switch {
	case errors.Is(err, generic.ErrDiscussionsTargetNotFound),
		errors.Is(err, generic.ErrDiscussionsLessonNotFound),
		errors.Is(err, generic.ErrDiscussionsDiscussionNotFound),
		errors.Is(err, generic.ErrDiscussionsParentNotFound):
		return utils.ErrNotFound("Resource not found.", err)
	case errors.Is(err, generic.ErrDiscussionsNotEnrolled),
		errors.Is(err, generic.ErrDiscussionsAccessDenied),
		errors.Is(err, generic.ErrDiscussionsParentInvalid):
		return utils.ErrForbidden(err.Error(), err)
	case errors.Is(err, generic.ErrDiscussionsMissingTarget):
		return utils.ErrBadRequest(err.Error(), err)
	default:
		return utils.ErrInternal("Operation failed.", err)
	}
}
