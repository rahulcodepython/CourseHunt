package roles

import (
	"fmt"
	"strconv"
	"time"

	"coursehunt/api/internals/generic"
	"coursehunt/api/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (m *RolesModule) ListRolesController(c *fiber.Ctx) error {
	cacheKey := "roles:list"
	var cached []Role
	if hit, _ := m.Cache.Get(c.Context(), cacheKey, &cached); hit {
		return utils.OK(c, "Roles fetched.", cached)
	}

	roles, err := m.ListRolesRepository()
	if err != nil {
		return utils.InternalError(c, "Failed to fetch roles.", err)
	}

	_ = m.Cache.Set(c.Context(), cacheKey, roles, 10*time.Minute)

	return utils.OK(c, "Roles fetched.", roles)
}

func (m *RolesModule) CreateRoleController(c *fiber.Ctx) error {
	var req CreateRoleRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}

	systemRoles := map[string]bool{"admin": true, "tutor": true, "user": true, "enrolled": true}
	if systemRoles[req.Name] {
		return utils.BadRequest(c, "Cannot create a role with a system role name.", nil)
	}

	role, err := m.CreateRoleRepository(req)
	if err != nil {
		return utils.InternalError(c, "Failed to create role.", err)
	}

	m.Cache.InvalidateRoles(c.Context())

	return utils.Created(c, "Role created.", role)
}

func (m *RolesModule) UpdateRoleController(c *fiber.Ctx) error {
	roleID, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return utils.BadRequest(c, "Invalid role ID.", err)
	}

	existing, err := m.GetRoleRepository(roleID)
	if err != nil {
		return utils.NotFound(c, "Role not found.", err)
	}
	if existing.IsSystem {
		return utils.Forbidden(c, "Cannot modify system roles.", nil)
	}

	var req UpdateRoleRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}

	role, err := m.UpdateRoleRepository(roleID, req)
	if err != nil {
		return utils.InternalError(c, "Failed to update role.", err)
	}

	m.Cache.InvalidateRoles(c.Context())

	return utils.OK(c, "Role updated.", role)
}

func (m *RolesModule) DeleteRoleController(c *fiber.Ctx) error {
	roleID, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return utils.BadRequest(c, "Invalid role ID.", err)
	}

	existing, err := m.GetRoleRepository(roleID)
	if err != nil {
		return utils.NotFound(c, "Role not found.", err)
	}
	if existing.IsSystem {
		return utils.Forbidden(c, "Cannot delete system roles.", nil)
	}

	roleIDStr, err := m.DeleteRoleRepository(roleID)
	if err != nil {
		return utils.InternalError(c, "Failed to delete role.", err)
	}

	m.Cache.InvalidateRoles(c.Context())

	return utils.OK(c, "Role deleted.", generic.DeleteResponse{ID: roleIDStr})
}

func (m *RolesModule) GetRolePermissionsController(c *fiber.Ctx) error {
	roleID, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return utils.BadRequest(c, "Invalid role ID.", err)
	}

	cacheKey := fmt.Sprintf("roles:permissions:role:%d", roleID)
	var cached []Permission
	if hit, _ := m.Cache.Get(c.Context(), cacheKey, &cached); hit {
		return utils.OK(c, "Permissions fetched.", cached)
	}

	permissions, err := m.GetRolePermissionsRepository(roleID)
	if err != nil {
		return utils.InternalError(c, "Failed to fetch role permissions.", err)
	}

	_ = m.Cache.Set(c.Context(), cacheKey, permissions, 10*time.Minute)

	return utils.OK(c, "Permissions fetched.", permissions)
}

func (m *RolesModule) SetRolePermissionsController(c *fiber.Ctx) error {
	roleID, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return utils.BadRequest(c, "Invalid role ID.", err)
	}

	existing, err := m.GetRoleRepository(roleID)
	if err != nil {
		return utils.NotFound(c, "Role not found.", err)
	}
	if existing.IsSystem {
		return utils.Forbidden(c, "Cannot modify system role permissions.", nil)
	}

	var req UpdateRolePermissionsRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}

	if err := m.SetRolePermissionsRepository(roleID, req.PermissionIDs); err != nil {
		return utils.InternalError(c, "Failed to update role permissions.", err)
	}

	m.Cache.InvalidateRoles(c.Context())

	return utils.OK(c, "Permissions updated.", fiber.Map{})
}

func (m *RolesModule) ListPermissionsController(c *fiber.Ctx) error {
	cacheKey := "permissions:list"
	var cached []Permission
	if hit, _ := m.Cache.Get(c.Context(), cacheKey, &cached); hit {
		return utils.OK(c, "Permissions fetched.", cached)
	}

	permissions, err := m.ListPermissionsRepository()
	if err != nil {
		return utils.InternalError(c, "Failed to fetch permissions.", err)
	}

	_ = m.Cache.Set(c.Context(), cacheKey, permissions, 10*time.Minute)

	return utils.OK(c, "Permissions fetched.", permissions)
}
