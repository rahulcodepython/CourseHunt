package v1

import (
	"coursehunt-backend/internals/middlewares"
	"coursehunt-backend/internals/services"
	"coursehunt-backend/internals/utils"
	"github.com/gofiber/fiber/v2"
)

type DashboardHandler struct {
	Dashboard *services.DashboardService
}

func NewDashboardHandler() *DashboardHandler {
	return &DashboardHandler{Dashboard: services.NewDashboardService()}
}

func (h *DashboardHandler) DashboardAdmin(c *fiber.Ctx) error {
	data, err := h.Dashboard.Admin()
	if err != nil {
		return utils.InternalError(c, "Failed to fetch dashboard")
	}

	return utils.OK(c, "Dashboard fetched successfully", data)
}

func (h *DashboardHandler) DashboardUser(c *fiber.Ctx) error {
	userID := c.Locals("user").(middlewares.UserContext).UserID
	data, err := h.Dashboard.User(userID)
	if err != nil {
		return utils.InternalError(c, "Failed to fetch dashboard")
	}
	return utils.OK(c, "Dashboard fetched successfully", data)
}
