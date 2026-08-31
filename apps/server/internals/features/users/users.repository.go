package users

import (
	"context"
	"encoding/json"

	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/pkg/postgres"
)

type UserListPayload struct {
	Total int                `json:"total"`
	Data  []UserListResponse `json:"data"`
}

func (a *App) GetRolesAndPermissions(ctx context.Context, userID string) (generic.RolesAndPermissionsResult, error) {
	var (
		role        string
		roles       []byte
		permissions []byte
		banned      bool
	)

	err := a.DB.QueryRow(ctx, GetRolesAndPermissions, userID).Scan(
		&role, &roles, &permissions, &banned,
	)
	if err != nil {
		return generic.RolesAndPermissionsResult{}, postgres.MapPgError(err)
	}

	out := generic.RolesAndPermissionsResult{Role: role, Banned: banned}
	if len(roles) > 0 && string(roles) != "null" {
		if err := json.Unmarshal(roles, &out.Roles); err != nil {
			return generic.RolesAndPermissionsResult{}, err
		}
	}
	if out.Roles == nil {
		out.Roles = []string{}
	}

	if len(permissions) > 0 && string(permissions) != "null" {
		if err := json.Unmarshal(permissions, &out.Permissions); err != nil {
			return generic.RolesAndPermissionsResult{}, err
		}
	}
	if out.Permissions == nil {
		out.Permissions = []string{}
	}

	return out, nil
}

func (a *App) AssignRoleRepository(ctx context.Context, userID string, roleIDs []string) error {
	_, err := a.DB.Exec(ctx, AssignRole, userID, roleIDs)
	return postgres.MapPgError(err)
}

func (a *App) DeleteRoleRepository(ctx context.Context, userID string, roleIDs []string) error {
	_, err := a.DB.Exec(ctx, DeleteRole, userID, roleIDs)
	return postgres.MapPgError(err)
}

func (a *App) ListRepository(ctx context.Context, page, limit int, name, email, role string) ([]UserListResponse, int, error) {
	offset := (page - 1) * limit
	filter := postgres.NewFilter(limit, offset)

	if name != "" {
		filter.Add("u.name ILIKE $%d", "%"+name+"%")
	}
	if email != "" {
		filter.Add("u.email ILIKE $%d", "%"+email+"%")
	}
	if role != "" {
		filter.Add2(UserRoleFilterTemplate, role)
	}

	query := BuildListUsersQuery(filter.Where(""))

	result, err := postgres.QueryJSON[UserListPayload](ctx, a.DB, query, filter.Args...)
	if err != nil {
		return nil, 0, err
	}
	if result == nil {
		return []UserListResponse{}, 0, nil
	}
	if result.Data == nil {
		result.Data = []UserListResponse{}
	}
	return result.Data, result.Total, nil
}
