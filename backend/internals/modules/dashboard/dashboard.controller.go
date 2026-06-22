package dashboard

import (
	"net/http"

	"coursehunt-backend/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (m *DashboardModule) UserDashboardController(ctx *fiber.Ctx) error {
	d, err := m.UserDashboardService(utils.GetUserID(ctx))
	if err != nil {
		return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to fetch user dashboard", nil, err.Error())
	}
	return utils.JSON(ctx, http.StatusOK, true, "user dashboard fetched", d, nil)
}

func (m *DashboardModule) TutorDashboardController(ctx *fiber.Ctx) error {
	d, err := m.TutorDashboardService(utils.GetUserID(ctx))
	if err != nil {
		return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to fetch tutor dashboard", nil, err.Error())
	}
	return utils.JSON(ctx, http.StatusOK, true, "tutor dashboard fetched", d, nil)
}

func (m *DashboardModule) AdminDashboardController(ctx *fiber.Ctx) error {
	d, err := m.AdminDashboardService()
	if err != nil {
		return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to fetch admin dashboard", nil, err.Error())
	}
	return utils.JSON(ctx, http.StatusOK, true, "admin dashboard fetched", d, nil)
}
