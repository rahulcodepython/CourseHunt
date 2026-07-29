package users

import (
	"coursehunt/api/internals/generic"
	"coursehunt/api/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (m *UsersModule) AssignRoleController(c *fiber.Ctx) error {
	var req AssignRoleRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	if err := m.AssignRoleRepository(c.Params("id"), req.RoleID); err != nil {
		return utils.InternalError(c, "Failed to assign role.", err)
	}
	return utils.OK(c, "Role assigned.", RoleAssignmentResponse{UserID: c.Params("id"), RoleID: req.RoleID})
}

func (m *UsersModule) DeleteRoleController(c *fiber.Ctx) error {
	var req AssignRoleRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	if err := m.DeleteRoleRepository(c.Params("id"), req.RoleID); err != nil {
		return utils.InternalError(c, "Failed to revoke role.", err)
	}
	return utils.OK(c, "Role revoked.", RoleAssignmentResponse{UserID: c.Params("id"), RoleID: req.RoleID})
}

func (m *UsersModule) ListController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	list, total, err := m.ListRepository(page, limit, c.Query("name"), c.Query("email"), c.Query("role"))
	if err != nil {
		return utils.InternalError(c, "Failed to fetch users.", err)
	}
	return utils.OK(c, "Users fetched.", generic.PaginatedResponse[[]UserListResponse]{
		Data: list, Total: total, Page: page, Limit: limit,
	})
}
