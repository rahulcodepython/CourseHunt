package updates

import (
	"context"

	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/pkg/postgres"
)

type UpdateListPayload struct {
	Total int            `json:"total"`
	Data  []CourseUpdate `json:"data"`
}

func (a *App) CreateRepository(ctx context.Context, createdBy string, req CreateUpdateRequest, scope generic.AuthScope) (*CourseUpdate, error) {
	var data []byte

	err := a.DB.QueryRow(
		ctx,
		CreateUpdate,
		req.CourseID, createdBy, req.Message, string(scope),
	).Scan(&data)
	if err != nil {
		return nil, postgres.MapPgError(err)
	}

	u, err := postgres.DecodeJSON[CourseUpdate](data)
	if err != nil {
		return nil, err
	}
	if u == nil {
		return nil, generic.ErrUpdatesAccessDenied
	}

	return u, nil
}

func (a *App) UpdateRepository(ctx context.Context, id, message string, userID string, scope generic.AuthScope) (*CourseUpdate, error) {
	var (
		dbID *string
		data []byte
	)

	err := a.DB.QueryRow(
		ctx,
		UpdateUpdate,
		id, userID, message, string(scope),
	).Scan(&dbID, &data)
	if err != nil {
		return nil, postgres.MapPgError(err)
	}

	if err := postgres.CheckConditions(
		postgres.Condition{Failed: dbID == nil, Err: generic.ErrUpdatesNotFound},
		postgres.Condition{Failed: len(data) == 0 || string(data) == "null", Err: generic.ErrUpdatesAccessDenied},
	); err != nil {
		return nil, err
	}

	return postgres.DecodeJSON[CourseUpdate](data)
}

func (a *App) DeleteRepository(ctx context.Context, id, userID string, scope generic.AuthScope) (string, error) {
	var (
		dbID      *string
		deletedID *string
	)

	err := a.DB.QueryRow(ctx, DeleteUpdate, id, userID, string(scope)).Scan(&dbID, &deletedID)
	if err != nil {
		return "", postgres.MapPgError(err)
	}

	if err := postgres.CheckConditions(
		postgres.Condition{Failed: dbID == nil, Err: generic.ErrUpdatesNotFound},
		postgres.Condition{Failed: deletedID == nil, Err: generic.ErrUpdatesAccessDenied},
	); err != nil {
		return "", err
	}

	return *deletedID, nil
}

func (a *App) FeedRepository(ctx context.Context, userID string, page, limit int) (*UpdateFeedResponse, error) {
	offset := (page - 1) * limit

	var (
		total   int
		updates []byte
	)

	err := a.DB.QueryRow(ctx, FeedUpdates, userID, limit, offset).Scan(&total, &updates)
	if err != nil {
		return nil, postgres.MapPgError(err)
	}

	feedUpdates, err := postgres.DecodeJSONSlice[UpdateFeedItem](updates)
	if err != nil {
		return nil, err
	}

	return &UpdateFeedResponse{
		Updates: generic.PaginatedResponse[[]UpdateFeedItem]{
			Data: feedUpdates, Total: total, Page: page, Limit: limit,
		},
	}, nil
}

func (a *App) ListRepository(ctx context.Context, page, limit int, userID string, scope generic.AuthScope) ([]CourseUpdate, int, error) {
	offset := (page - 1) * limit
	filter := postgres.NewFilter(limit, offset)

	where := DefaultUpdatesWhere
	if scope == generic.ScopeTutor {
		where = TutorUpdatesWhere
		filter.AddArgs(userID)
	}

	query := BuildListUpdatesQuery(where)

	result, err := postgres.QueryJSON[UpdateListPayload](ctx, a.DB, query, filter.Args...)
	if err != nil {
		return nil, 0, err
	}
	if result == nil {
		return []CourseUpdate{}, 0, nil
	}
	if result.Data == nil {
		result.Data = []CourseUpdate{}
	}
	return result.Data, result.Total, nil
}
