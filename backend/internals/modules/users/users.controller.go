package users

import (
	"net/http"

	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/utils"

	"github.com/gofiber/fiber/v2"
)

// @Summary ListController
// @Description ListController for Users
// @Tags Users
// @Accept json
// @Produce json
// @Success 200 {object} utils.PaginatedResponse[UserListResponse]
// @Router /api/v1/users [get]
func (m *UsersModule) ListController(ctx *fiber.Ctx) error {
	page, limit := utils.PaginationParams(ctx)
	list, total, err := m.ListService(page, limit, ctx.Query("search"), ctx.Query("role"))
	if err != nil {
		return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to fetch users", nil, err.Error())
	}
	return utils.JSON(ctx, http.StatusOK, true, "users fetched", models.PaginatedResponse[[]UserListResponse]{
		Data: list, Total: total, Page: page, Limit: limit,
	}, nil)
}

// @Summary AssignRoleController
// @Description AssignRoleController for Users
// @Tags Users
// @Accept json
// @Produce json
// @Param id path string true "id"
// @Param body body users.AssignRoleRequest true "Request Body"
// @Success 200 {object} utils.SwaggerResponse[RoleAssignmentResponse]
// @Router /api/v1/users/{id}/roles/assign [post]
func (m *UsersModule) AssignRoleController(ctx *fiber.Ctx) error {
	var req AssignRoleRequest
	if ok, err := utils.Validate(ctx, &req); !ok {
		return err
	}
	if err := m.AssignRoleService(ctx.Params("id"), req.RoleID); err != nil {
		return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to assign role", nil, err.Error())
	}
	return utils.JSON(ctx, http.StatusOK, true, "role assigned", map[string]interface{}{"user_id": ctx.Params("id"), "role_id": req.RoleID}, nil)
}

// @Summary DeleteRoleController
// @Description DeleteRoleController for Users
// @Tags Users
// @Accept json
// @Produce json
// @Param id path string true "id"
// @Param body body users.AssignRoleRequest true "Request Body"
// @Success 200 {object} utils.SwaggerResponse[RoleAssignmentResponse]
// @Router /api/v1/users/{id}/roles/revoke [post]
func (m *UsersModule) DeleteRoleController(ctx *fiber.Ctx) error {
	var req AssignRoleRequest
	if ok, err := utils.Validate(ctx, &req); !ok {
		return err
	}
	if err := m.DeleteRoleService(ctx.Params("id"), req.RoleID); err != nil {
		return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to revoke role", nil, err.Error())
	}
	return utils.JSON(ctx, http.StatusOK, true, "role revoked", map[string]interface{}{"user_id": ctx.Params("id"), "role_id": req.RoleID}, nil)
}

// @Summary MeController
// @Description MeController for Users
// @Tags Users
// @Accept json
// @Produce json
// @Success 200 {object} utils.SwaggerResponse[User]
// @Router /api/v1/me [get]
func (m *UsersModule) MeController(ctx *fiber.Ctx) error {
	u, err := m.ReadService(utils.GetUserID(ctx))
	if err != nil {
		return utils.JSON(ctx, http.StatusNotFound, false, "user not found", nil, nil)
	}
	return utils.JSON(ctx, http.StatusOK, true, "me fetched", u, nil)
}
