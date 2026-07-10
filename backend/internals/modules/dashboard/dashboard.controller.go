package dashboard

import (
	"net/http"

	"coursehunt-backend/internals/utils"

	"github.com/gofiber/fiber/v2"
)

// @Summary UserDashboardController
// @Description UserDashboardController for Dashboard
// @Tags Dashboard
// @Accept json
// @Produce json
// @Success 200 {object} utils.SwaggerResponse[UserDashboard]
// @Router /api/v1/dashboard/user [get]
func (m *DashboardModule) UserDashboardController(ctx *fiber.Ctx) error {
	d, err := m.UserDashboardService(utils.GetUserID(ctx))
	if err != nil {
		return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to fetch user dashboard", nil, err.Error())
	}
	return utils.JSON(ctx, http.StatusOK, true, "user dashboard fetched", d, nil)
}

// @Summary TutorDashboardController
// @Description TutorDashboardController for Dashboard
// @Tags Dashboard
// @Accept json
// @Produce json
// @Success 200 {object} utils.SwaggerResponse[TutorDashboard]
// @Router /api/v1/dashboard/tutor [get]
func (m *DashboardModule) TutorDashboardController(ctx *fiber.Ctx) error {
	d, err := m.TutorDashboardService(utils.GetUserID(ctx))
	if err != nil {
		return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to fetch tutor dashboard", nil, err.Error())
	}
	return utils.JSON(ctx, http.StatusOK, true, "tutor dashboard fetched", d, nil)
}

// @Summary AdminDashboardController
// @Description AdminDashboardController for Dashboard
// @Tags Dashboard
// @Accept json
// @Produce json
// @Success 200 {object} utils.SwaggerResponse[AdminDashboard]
// @Router /api/v1/dashboard/admin [get]
func (m *DashboardModule) AdminDashboardController(ctx *fiber.Ctx) error {
	d, err := m.AdminDashboardService()
	if err != nil {
		return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to fetch admin dashboard", nil, err.Error())
	}
	return utils.JSON(ctx, http.StatusOK, true, "admin dashboard fetched", d, nil)
}
