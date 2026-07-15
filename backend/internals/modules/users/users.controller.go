package users

import (
	"net/http"

	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (m *UsersModule) AssignRoleController(c *fiber.Ctx) error {
	var req AssignRoleRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	if err := m.AssignRoleRepository(c.Params("id"), req.RoleID); err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "Failed to assign role.", nil, nil)
	}
	return utils.JSON(c, http.StatusOK, true, "Role assigned.", map[string]interface{}{"user_id": c.Params("id"), "role_id": req.RoleID}, nil)
}

func (m *UsersModule) DeleteRoleController(c *fiber.Ctx) error {
	var req AssignRoleRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	if err := m.DeleteRoleRepository(c.Params("id"), req.RoleID); err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "Failed to revoke role.", nil, nil)
	}
	return utils.JSON(c, http.StatusOK, true, "Role revoked.", map[string]interface{}{"user_id": c.Params("id"), "role_id": req.RoleID}, nil)
}

func (m *UsersModule) ListController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	list, total, err := m.ListRepository(page, limit, c.Query("name"), c.Query("email"), c.Query("role"))
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "Failed to fetch users.", nil, nil)
	}
	return utils.JSON(c, http.StatusOK, true, "Users fetched.", models.PaginatedResponse[[]UserListResponse]{
		Data: list, Total: total, Page: page, Limit: limit,
	}, nil)
}
