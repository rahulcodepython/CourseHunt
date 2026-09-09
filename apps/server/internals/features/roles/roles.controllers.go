package roles

import (
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (a *App) handleListRoles(c *fiber.Ctx) error {
	rolesList, err := a.List(c.UserContext())
	if err != nil {
		return err
	}
	return utils.OK(c, "Roles fetched.", rolesList)
}

func (a *App) handleCreateRole(c *fiber.Ctx) error {
	var req CreateRoleRequest
	if err := utils.BindAndValidate(c, &req); err != nil {
		return err
	}

	role, err := a.Create(c.UserContext(), req)
	if err != nil {
		return err
	}

	return utils.Created(c, "Role created.", role)
}

func (a *App) handleUpdateRole(c *fiber.Ctx) error {
	roleID := c.Params("id")

	var req UpdateRoleRequest
	if err := utils.BindAndValidate(c, &req); err != nil {
		return err
	}

	role, err := a.Update(c.UserContext(), roleID, req)
	if err != nil {
		return err
	}

	return utils.OK(c, "Role updated.", role)
}

func (a *App) handleDeleteRole(c *fiber.Ctx) error {
	deletedID, err := a.Delete(c.UserContext(), c.Params("id"))
	if err != nil {
		return err
	}
	return utils.OK(c, "Role deleted.", generic.DeleteResponse{ID: deletedID})
}

func (a *App) handleGetRolePermissions(c *fiber.Ctx) error {
	permissions, err := a.GetPermissions(c.UserContext(), c.Params("id"))
	if err != nil {
		return err
	}
	return utils.OK(c, "Permissions fetched.", permissions)
}

func (a *App) handleSetRolePermissions(c *fiber.Ctx) error {
	roleID := c.Params("id")

	var req UpdateRolePermissionsRequest
	if err := utils.BindAndValidate(c, &req); err != nil {
		return err
	}

	if err := a.SetPermissions(c.UserContext(), roleID, req); err != nil {
		return err
	}

	return utils.OK(c, "Permissions updated.", fiber.Map{})
}

func (a *App) handleListPermissions(c *fiber.Ctx) error {
	permissions, err := a.ListPermissions(c.UserContext())
	if err != nil {
		return err
	}
	return utils.OK(c, "Permissions fetched.", permissions)
}
