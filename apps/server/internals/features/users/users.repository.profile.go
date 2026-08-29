package users

import (
	"context"
	"errors"

	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/pkg/postgres"
)

type AdminProfileListPayload struct {
	Total int                `json:"total"`
	Data  []AdminProfileItem `json:"data"`
}

func (a *App) ReadProfileRepository(ctx context.Context, userID string) (*Profile, error) {
	return postgres.QueryJSON[Profile](ctx, a.DB, ReadProfile, userID)
}

func (a *App) UpsertProfileRepository(ctx context.Context, userID string, req UpdateProfileRequest) (*Profile, error) {
	var (
		emailVerified bool
		insertedData  []byte
	)

	err := a.DB.QueryRow(ctx, UpsertProfile, userID, req.Headline, req.Bio, req.Website).Scan(
		&emailVerified, &insertedData,
	)
	if err != nil {
		return nil, postgres.MapPgError(err)
	}

	if err := postgres.CheckConditions(
		postgres.Condition{Failed: !emailVerified, Err: generic.ErrUsersNotVerified},
		postgres.Condition{Failed: len(insertedData) == 0 || string(insertedData) == "null", Err: errors.New("failed to save profile")},
	); err != nil {
		return nil, err
	}

	return postgres.DecodeJSON[Profile](insertedData)
}

func (a *App) AdminListProfilesRepository(ctx context.Context, page, limit int) ([]AdminProfileItem, int, error) {
	offset := (page - 1) * limit

	result, err := postgres.QueryJSON[AdminProfileListPayload](ctx, a.DB, AdminListProfiles, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	if result == nil {
		return []AdminProfileItem{}, 0, nil
	}
	if result.Data == nil {
		result.Data = []AdminProfileItem{}
	}
	return result.Data, result.Total, nil
}
