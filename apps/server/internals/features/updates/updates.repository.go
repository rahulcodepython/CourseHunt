package updates

import (
	"context"

	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/pkg/postgres"
)

func (a *App) AdminListRepository(ctx context.Context, page, limit int, courseID string) ([]CourseUpdate, int, error) {
	offset := (page - 1) * limit
	where := DefaultUpdatesWhere
	args := []interface{}{limit, offset}
	if courseID != "" {
		where += " AND u.course_id = $3"
		args = append(args, courseID)
	}
	query := BuildListUpdatesQuery(where)

	payload, err := postgres.QueryJSON[updatesPayload](ctx, a.DB, query, args...)
	if err != nil {
		return nil, 0, err
	}
	if payload == nil || payload.Data == nil {
		return []CourseUpdate{}, 0, nil
	}
	return payload.Data, payload.Total, nil
}

func (a *App) TutorListRepository(ctx context.Context, page, limit int, userID, courseID string) ([]CourseUpdate, int, error) {
	offset := (page - 1) * limit
	where := TutorUpdatesWhere
	args := []interface{}{limit, offset, userID}
	if courseID != "" {
		where += " AND u.course_id = $4"
		args = append(args, courseID)
	}
	query := BuildListUpdatesQuery(where)

	payload, err := postgres.QueryJSON[updatesPayload](ctx, a.DB, query, args...)
	if err != nil {
		return nil, 0, err
	}
	if payload == nil || payload.Data == nil {
		return []CourseUpdate{}, 0, nil
	}
	return payload.Data, payload.Total, nil
}

func (a *App) AdminCreateRepository(ctx context.Context, userID string, req CreateUpdateRequest) (*CourseUpdate, error) {
	u, err := postgres.QueryJSON[CourseUpdate](ctx, a.DB, AdminCreateUpdate, req.CourseID, userID, req.Message)
	if err != nil {
		return nil, postgres.MapPgError(err)
	}
	return u, nil
}

func (a *App) TutorCreateRepository(ctx context.Context, userID string, req CreateUpdateRequest) (*CourseUpdate, error) {
	u, err := postgres.QueryJSON[CourseUpdate](ctx, a.DB, TutorCreateUpdate, req.CourseID, userID, req.Message)
	if err != nil {
		return nil, postgres.MapPgError(err)
	}
	if u == nil {
		return nil, generic.ErrUpdatesAccessDenied
	}
	return u, nil
}

func (a *App) AdminUpdateRepository(ctx context.Context, id, message string) (*CourseUpdate, error) {
	var (
		dbID string
		data []byte
	)
	err := a.DB.QueryRow(ctx, AdminUpdateUpdate, id, message).Scan(&dbID, &data)
	if err != nil {
		return nil, postgres.MapPgError(err)
	}
	if dbID == "" {
		return nil, generic.ErrUpdatesNotFound
	}

	return postgres.DecodeJSON[CourseUpdate](data)
}

func (a *App) TutorUpdateRepository(ctx context.Context, id, message, userID string) (*CourseUpdate, error) {
	var (
		dbID string
		data []byte
	)
	err := a.DB.QueryRow(ctx, TutorUpdateUpdate, id, userID, message).Scan(&dbID, &data)
	if err != nil {
		return nil, postgres.MapPgError(err)
	}
	if dbID == "" {
		return nil, generic.ErrUpdatesNotFound
	}
	if len(data) == 0 {
		return nil, generic.ErrUpdatesAccessDenied
	}

	return postgres.DecodeJSON[CourseUpdate](data)
}

func (a *App) AdminDeleteRepository(ctx context.Context, id string) (string, error) {
	var dbID, deletedID *string
	err := a.DB.QueryRow(ctx, AdminDeleteUpdate, id).Scan(&dbID, &deletedID)
	if err != nil {
		return "", postgres.MapPgError(err)
	}
	if dbID == nil {
		return "", generic.ErrUpdatesNotFound
	}
	return *deletedID, nil
}

func (a *App) TutorDeleteRepository(ctx context.Context, id, userID string) (string, error) {
	var dbID, deletedID *string
	err := a.DB.QueryRow(ctx, TutorDeleteUpdate, id, userID).Scan(&dbID, &deletedID)
	if err != nil {
		return "", postgres.MapPgError(err)
	}
	if dbID == nil {
		return "", generic.ErrUpdatesNotFound
	}
	if deletedID == nil {
		return "", generic.ErrUpdatesAccessDenied
	}
	return *deletedID, nil
}

func (a *App) FeedRepository(ctx context.Context, userID string, page, limit int) (*UpdateFeedResponse, error) {
	offset := (page - 1) * limit
	return postgres.QueryJSON[UpdateFeedResponse](ctx, a.DB, FeedUpdates, userID, limit, offset, page)
}

