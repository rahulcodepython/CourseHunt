package discussions

import (
	"context"
	"fmt"

	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/pkg/postgres"
)

func (a *App) ListRepository(ctx context.Context, lessonID, parentID, userID string, scope generic.AuthScope, page, limit int) ([]Discussion, int, error) {
	if lessonID == "" && parentID == "" {
		return nil, 0, generic.ErrDiscussionsMissingTarget
	}
	offset := (page - 1) * limit

	authCTE := BuildAuthCTE(scope)
	hasAuth := (scope == generic.ScopeUser || scope == generic.ScopeTutor)
	query := BuildListQuery(authCTE, hasAuth)

	var (
		targetExists bool
		isAuthorized bool
		total        int
		data         []byte
	)

	err := a.DB.QueryRow(ctx, query, lessonID, parentID, userID, limit, offset).Scan(
		&targetExists, &isAuthorized, &total, &data,
	)
	if err != nil {
		return nil, 0, postgres.MapPgError(err)
	}

	if !targetExists {
		return nil, 0, generic.ErrDiscussionsTargetNotFound
	}
	if hasAuth && !isAuthorized {
		return nil, 0, errorForScopeAuth(scope)
	}

	list, err := postgres.DecodeJSONSlice[Discussion](data)
	if err != nil {
		return nil, 0, err
	}

	return list, total, nil
}

func (a *App) CreateRepository(ctx context.Context, userID string, req CreateDiscussionRequest, scope generic.AuthScope) (*Discussion, error) {
	authCTE, requiresAuth := BuildCreateAuthCTE(scope)
	query := BuildCreateQuery(authCTE, requiresAuth)

	var (
		lessonExists bool
		isAuthorized bool
		parentExists bool
		parentValid  bool
		insertedData []byte
	)

	err := a.DB.QueryRow(ctx, query, req.LessonID, req.ParentID, userID, req.Content).Scan(
		&lessonExists, &isAuthorized, &parentExists, &parentValid, &insertedData,
	)
	if err != nil {
		return nil, postgres.MapPgError(err)
	}

	if err := postgres.CheckConditions(
		postgres.Condition{Failed: !lessonExists, Err: generic.ErrDiscussionsLessonNotFound},
		postgres.Condition{Failed: requiresAuth && !isAuthorized, Err: errorForScopeAuth(scope)},
		postgres.Condition{Failed: !parentExists, Err: generic.ErrDiscussionsParentNotFound},
		postgres.Condition{Failed: !parentValid, Err: generic.ErrDiscussionsParentInvalid},
		postgres.Condition{Failed: len(insertedData) == 0 || string(insertedData) == "null", Err: fmt.Errorf("failed to post discussion")},
	); err != nil {
		return nil, err
	}

	return postgres.DecodeJSON[Discussion](insertedData)
}

func (a *App) UpdateRepository(ctx context.Context, id, userID string, content string, scope generic.AuthScope) (*Discussion, error) {
	authCTE := BuildUpdateAuthCTE(scope)
	hasAuth := (scope == generic.ScopeUser || scope == generic.ScopeTutor)
	ownerClause, checkOwner := OwnerWhereClause(scope, "$2")
	query := BuildUpdateQuery(authCTE, ownerClause, checkOwner, hasAuth)

	var (
		discussionExists bool
		isOwner          bool
		isAuthorized     bool
		updatedData      []byte
	)

	err := a.DB.QueryRow(ctx, query, id, userID, content).Scan(
		&discussionExists, &isOwner, &isAuthorized, &updatedData,
	)
	if err != nil {
		return nil, postgres.MapPgError(err)
	}

	if err := postgres.CheckConditions(
		postgres.Condition{Failed: !discussionExists, Err: generic.ErrDiscussionsDiscussionNotFound},
		postgres.Condition{Failed: checkOwner && !isOwner, Err: generic.ErrDiscussionsAccessDenied},
		postgres.Condition{Failed: hasAuth && !isAuthorized, Err: errorForScopeAuth(scope)},
		postgres.Condition{Failed: len(updatedData) == 0 || string(updatedData) == "null", Err: fmt.Errorf("failed to update discussion")},
	); err != nil {
		return nil, err
	}

	return postgres.DecodeJSON[Discussion](updatedData)
}

func (a *App) DeleteRepository(ctx context.Context, id, userID string, scope generic.AuthScope) (string, error) {
	authCTE, requiresAuth := BuildDeleteAuthCTE(scope)

	var (
		discussionExists bool
		isAuthorized     bool
		deletedID        *string
	)

	if scope == generic.ScopeAdmin {
		err := a.DB.QueryRow(ctx, DeleteAdmin, id).Scan(&discussionExists, &isAuthorized, &deletedID)
		if err != nil {
			return "", postgres.MapPgError(err)
		}
	} else {
		query := BuildDeleteQuery(authCTE)
		err := a.DB.QueryRow(ctx, query, id, userID).Scan(&discussionExists, &isAuthorized, &deletedID)
		if err != nil {
			return "", postgres.MapPgError(err)
		}
	}

	if err := postgres.CheckConditions(
		postgres.Condition{Failed: !discussionExists, Err: generic.ErrDiscussionsDiscussionNotFound},
		postgres.Condition{Failed: requiresAuth && !isAuthorized, Err: errorForScopeAuth(scope)},
		postgres.Condition{Failed: deletedID == nil, Err: fmt.Errorf("failed to delete discussion")},
	); err != nil {
		return "", err
	}

	return *deletedID, nil
}

func errorForScopeAuth(scope generic.AuthScope) error {
	switch scope {
	case generic.ScopeUser:
		return generic.ErrDiscussionsNotEnrolled
	case generic.ScopeTutor:
		return generic.ErrDiscussionsAccessDenied
	default:
		return generic.ErrDiscussionsAccessDenied
	}
}
