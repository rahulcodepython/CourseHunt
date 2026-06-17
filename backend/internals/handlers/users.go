package handlers

import (
	"net/http"

	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/services"
	"coursehunt-backend/internals/utils"
	"github.com/gofiber/fiber/v2"
)

type UserHandler struct{ Svc *services.UserService }

func NewUserHandler() *UserHandler { return &UserHandler{Svc: services.NewUserService()} }

func (h *UserHandler) List(c *fiber.Ctx) error {
	page, limit := paginationParams(c)
	list, total, err := h.Svc.List(page, limit, c.Query("search"), c.Query("role"))
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to fetch users", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "users fetched", models.PaginatedResponse{
		Data: list, Total: total, Page: page, Limit: limit,
	}, nil)
}

func (h *UserHandler) AssignRole(c *fiber.Ctx) error {
	var req models.AssignRoleRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	if err := h.Svc.AssignRole(c.Params("id"), req.RoleID); err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to assign role", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "role assigned", nil, nil)
}

func (h *UserHandler) RevokeRole(c *fiber.Ctx) error {
	var req models.AssignRoleRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	if err := h.Svc.RevokeRole(c.Params("id"), req.RoleID); err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to revoke role", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "role revoked", nil, nil)
}

func (h *UserHandler) Me(c *fiber.Ctx) error {
	u, err := h.Svc.FindByID(getUserID(c))
	if err != nil {
		return utils.JSON(c, http.StatusNotFound, false, "user not found", nil, nil)
	}
	return utils.JSON(c, http.StatusOK, true, "me fetched", u, nil)
}
