package roles

import (
	"context"
	"fmt"
	"time"

	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/pkg/cache"
	"coursehunt/server/internals/utils"
)

func (a *App) List(ctx context.Context) ([]Role, error) {
	return cache.Fetch(ctx, a.Cache, "roles:list", 10*time.Minute, func() ([]Role, error) {
		rolesList, err := a.ListRolesRepository(ctx)
		if err != nil {
			return nil, utils.ErrInternal("Failed to fetch roles.", err)
		}
		return rolesList, nil
	})
}

// isSystemRoleName reports whether name collides with one of the three
// fixed account-segment roles, which can never be created/modified/deleted
// as a custom role.
func isSystemRoleName(name string) bool {
	systemRoles := map[string]bool{generic.RoleAdmin: true, generic.RoleTutor: true, generic.RoleUser: true}
	return systemRoles[name]
}

func (a *App) Create(ctx context.Context, req CreateRoleRequest) (*Role, error) {
	if isSystemRoleName(req.Name) {
		return nil, utils.ErrBadRequest("Cannot create a role with a system role name.", nil)
	}

	role, err := a.CreateRoleRepository(ctx, req)
	if err != nil {
		return nil, utils.ErrInternal("Failed to create role.", err)
	}

	a.Cache.Invalidate(ctx, "roles:*", "permissions:*")

	return role, nil
}

func (a *App) Update(ctx context.Context, roleID string, req UpdateRoleRequest) (*Role, error) {
	if roleID == "" {
		return nil, utils.ErrBadRequest("Invalid role ID.", nil)
	}

	existing, err := a.GetRoleRepository(ctx, roleID)
	if err != nil {
		return nil, utils.ErrNotFound("Role not found.", err)
	}
	if existing.IsSystem {
		return nil, utils.ErrForbidden("Cannot modify system roles.", nil)
	}

	role, err := a.UpdateRoleRepository(ctx, roleID, req)
	if err != nil {
		return nil, utils.ErrInternal("Failed to update role.", err)
	}

	a.Cache.Invalidate(ctx, "roles:*", "permissions:*")

	return role, nil
}

func (a *App) Delete(ctx context.Context, roleID string) (string, error) {
	if roleID == "" {
		return "", utils.ErrBadRequest("Invalid role ID.", nil)
	}

	existing, err := a.GetRoleRepository(ctx, roleID)
	if err != nil {
		return "", utils.ErrNotFound("Role not found.", err)
	}
	if existing.IsSystem {
		return "", utils.ErrForbidden("Cannot delete system roles.", nil)
	}

	assignedCount, err := a.CountRoleAssignmentsRepository(ctx, roleID)
	if err != nil {
		return "", utils.ErrInternal("Failed to check role assignments.", err)
	}
	if assignedCount > 0 {
		return "", utils.ErrValidation("Unable to delete: this role is currently assigned to one or more users.", nil)
	}

	deletedID, err := a.DeleteRoleRepository(ctx, roleID)
	if err != nil {
		return "", utils.ErrInternal("Failed to delete role.", err)
	}

	a.Cache.Invalidate(ctx, "roles:*", "permissions:*")

	return deletedID, nil
}

func (a *App) GetPermissions(ctx context.Context, roleID string) ([]Permission, error) {
	if roleID == "" {
		return nil, utils.ErrBadRequest("Invalid role ID.", nil)
	}

	cacheKey := fmt.Sprintf("roles:permissions:role:%s", roleID)
	return cache.Fetch(ctx, a.Cache, cacheKey, 10*time.Minute, func() ([]Permission, error) {
		permissions, err := a.GetRolePermissionsRepository(ctx, roleID)
		if err != nil {
			return nil, utils.ErrInternal("Failed to fetch role permissions.", err)
		}
		return permissions, nil
	})
}

func (a *App) SetPermissions(ctx context.Context, roleID string, req UpdateRolePermissionsRequest) error {
	if roleID == "" {
		return utils.ErrBadRequest("Invalid role ID.", nil)
	}

	existing, err := a.GetRoleRepository(ctx, roleID)
	if err != nil {
		return utils.ErrNotFound("Role not found.", err)
	}
	if existing.IsSystem {
		return utils.ErrForbidden("Cannot modify system role permissions.", nil)
	}

	if err := a.SetRolePermissionsRepository(ctx, roleID, req.PermissionIDs); err != nil {
		return utils.ErrInternal("Failed to update role permissions.", err)
	}

	a.Cache.Invalidate(ctx, "roles:*", "permissions:*")
	// Every user holding this role now has different effective permissions —
	// bust the per-user auth cache app-wide since it's unknown which users
	// hold it (see internals/middlewares/auth.go's authCacheTTL fallback).
	a.Cache.InvalidateAllUserAuthCache(ctx)

	return nil
}

func (a *App) ListPermissions(ctx context.Context) ([]Permission, error) {
	return cache.Fetch(ctx, a.Cache, "permissions:list", 10*time.Minute, func() ([]Permission, error) {
		permissions, err := a.ListPermissionsRepository(ctx)
		if err != nil {
			return nil, utils.ErrInternal("Failed to fetch permissions.", err)
		}
		return permissions, nil
	})
}
