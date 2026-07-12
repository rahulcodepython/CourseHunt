package users

import (
	"net/http"

	"coursehunt-backend/internals/utils"

	"github.com/gofiber/fiber/v2"
)

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
	if err := m.AssignRoleRepository(ctx.Params("id"), req.RoleID); err != nil {
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
	if err := m.DeleteRoleRepository(ctx.Params("id"), req.RoleID); err != nil {
		return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to revoke role", nil, err.Error())
	}
	return utils.JSON(ctx, http.StatusOK, true, "role revoked", map[string]interface{}{"user_id": ctx.Params("id"), "role_id": req.RoleID}, nil)
}
