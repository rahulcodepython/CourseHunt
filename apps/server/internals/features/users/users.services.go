package users

import (
	"context"
	"errors"

	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/utils"
)

func (a *App) AssignRole(ctx context.Context, userID string, roleIDs []string) error {
	if err := a.AssignRoleRepository(ctx, userID, roleIDs); err != nil {
		return utils.ErrInternal("Failed to assign roles.", err)
	}
	return nil
}

func (a *App) DeleteRole(ctx context.Context, userID string, roleIDs []string) error {
	if err := a.DeleteRoleRepository(ctx, userID, roleIDs); err != nil {
		return utils.ErrInternal("Failed to revoke roles.", err)
	}
	return nil
}

func (a *App) List(ctx context.Context, page, limit int, name, email, role string) ([]UserListResponse, int, error) {
	list, total, err := a.ListRepository(ctx, page, limit, name, email, role)
	if err != nil {
		return nil, 0, utils.ErrInternal("Failed to fetch users.", err)
	}
	return list, total, nil
}

// ── Profile ──

func (a *App) ReadProfile(ctx context.Context, userID string) (*Profile, error) {
	p, err := a.ReadProfileRepository(ctx, userID)
	if err != nil {
		return nil, utils.ErrNotFound("Profile not found.", err)
	}
	return p, nil
}

func (a *App) UpsertProfile(ctx context.Context, userID string, req UpdateProfileRequest) (*Profile, error) {
	p, err := a.UpsertProfileRepository(ctx, userID, req)
	if err != nil {
		if errors.Is(err, generic.ErrUsersNotVerified) {
			return nil, utils.ErrForbidden("Access denied. Email is not verified.", err)
		}
		return nil, utils.ErrInternal("Failed to save profile.", err)
	}
	return p, nil
}

func (a *App) AdminListProfiles(ctx context.Context, page, limit int) ([]AdminProfileItem, int, error) {
	list, total, err := a.AdminListProfilesRepository(ctx, page, limit)
	if err != nil {
		return nil, 0, utils.ErrInternal("Failed to list profiles.", err)
	}
	return list, total, nil
}
