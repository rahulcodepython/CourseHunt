package roles

import (
	"context"
	"fmt"
	"strings"

	"coursehunt/server/internals/pkg/postgres"

	"github.com/jackc/pgx/v5"
)

func (a *App) ListRolesRepository(ctx context.Context) ([]Role, error) {
	return postgres.QueryJSONSlice[Role](ctx, a.DB, ListRoles)
}

func (a *App) CreateRoleRepository(ctx context.Context, req CreateRoleRequest) (*Role, error) {
	return postgres.QueryJSON[Role](ctx, a.DB, CreateRole, req.Name, req.Description)
}

func (a *App) GetRoleRepository(ctx context.Context, roleID string) (*Role, error) {
	return postgres.QueryJSON[Role](ctx, a.DB, GetRole, roleID)
}

func (a *App) UpdateRoleRepository(ctx context.Context, roleID string, req UpdateRoleRequest) (*Role, error) {
	filter := postgres.NewFilter()

	if req.Name != nil {
		filter.Add("name = $%d", *req.Name)
	}
	if req.Description != nil {
		filter.Add("description = $%d", *req.Description)
	}

	if len(filter.Conditions()) == 0 {
		return a.GetRoleRepository(ctx, roleID)
	}

	roleIDIdx := filter.NextIdx()
	filter.AddArgs(roleID)

	query := BuildUpdateRoleQuery(strings.Join(filter.Conditions(), ", "), roleIDIdx)

	return postgres.QueryJSON[Role](ctx, a.DB, query, filter.Args...)
}

func (a *App) CountRoleAssignmentsRepository(ctx context.Context, roleID string) (int, error) {
	var count int
	err := a.DB.QueryRow(ctx, CountRoleAssignments, roleID).Scan(&count)
	if err != nil {
		return 0, postgres.MapPgError(err)
	}
	return count, nil
}

func (a *App) DeleteRoleRepository(ctx context.Context, roleID string) (string, error) {
	var deletedID string
	err := a.DB.QueryRow(ctx, DeleteRole, roleID).Scan(&deletedID)
	if err != nil {
		return "", postgres.MapPgError(err)
	}
	return deletedID, nil
}

func (a *App) GetRolePermissionsRepository(ctx context.Context, roleID string) ([]Permission, error) {
	return postgres.QueryJSONSlice[Permission](ctx, a.DB, GetRolePermissions, roleID)
}

func (a *App) SetRolePermissionsRepository(ctx context.Context, roleID string, permissionIDs []string) error {
	return postgres.WithTx(ctx, a.DB, func(tx pgx.Tx) error {
		if _, err := tx.Exec(ctx, DeleteRolePermissions, roleID); err != nil {
			return err
		}

		if len(permissionIDs) > 0 {
			values := []string{}
			args := []any{roleID}
			for i, pid := range permissionIDs {
				idx := i + 2
				values = append(values, fmt.Sprintf("($1, $%d)", idx))
				args = append(args, pid)
			}
			query := BuildInsertRolePermissionsQuery(strings.Join(values, ", "))
			if _, err := tx.Exec(ctx, query, args...); err != nil {
				return err
			}
		}

		return nil
	})
}

func (a *App) ListPermissionsRepository(ctx context.Context) ([]Permission, error) {
	return postgres.QueryJSONSlice[Permission](ctx, a.DB, ListPermissions)
}
