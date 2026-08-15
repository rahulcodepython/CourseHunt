package controllers

import (
	"fmt"
	"time"

	"coursehunt/server/internals/config"
	"coursehunt/server/internals/entities"
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/repositories"
	"coursehunt/server/internals/utils"

	"github.com/gofiber/fiber/v2"
)

type RolesController struct {
	Repo *repositories.RolesRepository
	Cfg  *config.Config
}

func NewRolesController(repo *repositories.RolesRepository, cfg *config.Config) *RolesController {
	return &RolesController{Repo: repo, Cfg: cfg}
}

func (ctrl *RolesController) ListRolesController(c *fiber.Ctx) error {
	cacheKey := "roles:list"
	var cached []entities.Role
	if hit, _ := ctrl.Repo.Cache.Get(c.Context(), cacheKey, &cached); hit {
		return utils.OK(c, "Roles fetched.", cached)
	}

	roles, err := ctrl.Repo.ListRolesRepository()
	if err != nil {
		return utils.InternalError(c, "Failed to fetch roles.", err)
	}

	_ = ctrl.Repo.Cache.Set(c.Context(), cacheKey, roles, 10*time.Minute)

	return utils.OK(c, "Roles fetched.", roles)
}

func (ctrl *RolesController) CreateRoleController(c *fiber.Ctx) error {
	var req entities.CreateRoleRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}

	systemRoles := map[string]bool{generic.RoleAdmin: true, generic.RoleTutor: true, generic.RoleUser: true}
	if systemRoles[req.Name] {
		return utils.BadRequest(c, "Cannot create a role with a system role name.", nil)
	}

	role, err := ctrl.Repo.CreateRoleRepository(req)
	if err != nil {
		return utils.InternalError(c, "Failed to create role.", err)
	}

	ctrl.Repo.Cache.InvalidateRoles(c.Context())

	return utils.Created(c, "Role created.", role)
}

func (ctrl *RolesController) UpdateRoleController(c *fiber.Ctx) error {
	roleID := c.Params("id")
	if roleID == "" {
		return utils.BadRequest(c, "Invalid role ID.", nil)
	}

	existing, err := ctrl.Repo.GetRoleRepository(roleID)
	if err != nil {
		return utils.NotFound(c, "Role not found.", err)
	}
	if existing.IsSystem {
		return utils.Forbidden(c, "Cannot modify system roles.", nil)
	}

	var req entities.UpdateRoleRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}

	role, err := ctrl.Repo.UpdateRoleRepository(roleID, req)
	if err != nil {
		return utils.InternalError(c, "Failed to update role.", err)
	}

	ctrl.Repo.Cache.InvalidateRoles(c.Context())

	return utils.OK(c, "Role updated.", role)
}

func (ctrl *RolesController) DeleteRoleController(c *fiber.Ctx) error {
	roleID := c.Params("id")
	if roleID == "" {
		return utils.BadRequest(c, "Invalid role ID.", nil)
	}

	existing, err := ctrl.Repo.GetRoleRepository(roleID)
	if err != nil {
		return utils.NotFound(c, "Role not found.", err)
	}
	if existing.IsSystem {
		return utils.Forbidden(c, "Cannot delete system roles.", nil)
	}

	roleIDStr, err := ctrl.Repo.DeleteRoleRepository(roleID)
	if err != nil {
		return utils.InternalError(c, "Failed to delete role.", err)
	}

	ctrl.Repo.Cache.InvalidateRoles(c.Context())

	return utils.OK(c, "Role deleted.", generic.DeleteResponse{ID: roleIDStr})
}

func (ctrl *RolesController) GetRolePermissionsController(c *fiber.Ctx) error {
	roleID := c.Params("id")
	if roleID == "" {
		return utils.BadRequest(c, "Invalid role ID.", nil)
	}

	cacheKey := fmt.Sprintf("roles:permissions:role:%s", roleID)
	var cached []entities.Permission
	if hit, _ := ctrl.Repo.Cache.Get(c.Context(), cacheKey, &cached); hit {
		return utils.OK(c, "Permissions fetched.", cached)
	}

	permissions, err := ctrl.Repo.GetRolePermissionsRepository(roleID)
	if err != nil {
		return utils.InternalError(c, "Failed to fetch role permissions.", err)
	}

	_ = ctrl.Repo.Cache.Set(c.Context(), cacheKey, permissions, 10*time.Minute)

	return utils.OK(c, "Permissions fetched.", permissions)
}

func (ctrl *RolesController) SetRolePermissionsController(c *fiber.Ctx) error {
	roleID := c.Params("id")
	if roleID == "" {
		return utils.BadRequest(c, "Invalid role ID.", nil)
	}

	existing, err := ctrl.Repo.GetRoleRepository(roleID)
	if err != nil {
		return utils.NotFound(c, "Role not found.", err)
	}
	if existing.IsSystem {
		return utils.Forbidden(c, "Cannot modify system role permissions.", nil)
	}

	var req entities.UpdateRolePermissionsRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}

	if err := ctrl.Repo.SetRolePermissionsRepository(roleID, req.PermissionIDs); err != nil {
		return utils.InternalError(c, "Failed to update role permissions.", err)
	}

	ctrl.Repo.Cache.InvalidateRoles(c.Context())

	return utils.OK(c, "Permissions updated.", fiber.Map{})
}

func (ctrl *RolesController) ListPermissionsController(c *fiber.Ctx) error {
	cacheKey := "permissions:list"
	var cached []entities.Permission
	if hit, _ := ctrl.Repo.Cache.Get(c.Context(), cacheKey, &cached); hit {
		return utils.OK(c, "Permissions fetched.", cached)
	}

	permissions, err := ctrl.Repo.ListPermissionsRepository()
	if err != nil {
		return utils.InternalError(c, "Failed to fetch permissions.", err)
	}

	_ = ctrl.Repo.Cache.Set(c.Context(), cacheKey, permissions, 10*time.Minute)

	return utils.OK(c, "Permissions fetched.", permissions)
}
