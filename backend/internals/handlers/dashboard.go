package handlers

import (
	"net/http"

	"coursehunt-backend/internals/services"
	"coursehunt-backend/internals/utils"
	"github.com/gofiber/fiber/v2"
)

type DashboardHandler struct{ Svc *services.DashboardService }

func NewDashboardHandler() *DashboardHandler { return &DashboardHandler{Svc: services.NewDashboardService()} }

func (h *DashboardHandler) UserDashboard(c *fiber.Ctx) error {
	d, err := h.Svc.User(getUserID(c))
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to fetch user dashboard", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "user dashboard fetched", d, nil)
}

func (h *DashboardHandler) TutorDashboard(c *fiber.Ctx) error {
	d, err := h.Svc.Tutor(getUserID(c))
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to fetch tutor dashboard", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "tutor dashboard fetched", d, nil)
}

func (h *DashboardHandler) AdminDashboard(c *fiber.Ctx) error {
	d, err := h.Svc.Admin()
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to fetch admin dashboard", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "admin dashboard fetched", d, nil)
}
