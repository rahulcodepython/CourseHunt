package dashboard

import (
	"net/http"

	"coursehunt-backend/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (m *DashboardModule) UserDashboardController(c *fiber.Ctx) error {
	d, err := m.UserDashboardRepository(utils.GetUserID(c))
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "Failed to fetch user dashboard.", nil, nil)
	}
	return utils.JSON(c, http.StatusOK, true, "User dashboard fetched.", d, nil)
}

func (m *DashboardModule) TutorDashboardController(c *fiber.Ctx) error {
	d, err := m.TutorDashboardRepository(utils.GetUserID(c))
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "Failed to fetch tutor dashboard.", nil, nil)
	}
	return utils.JSON(c, http.StatusOK, true, "Tutor dashboard fetched.", d, nil)
}

func (m *DashboardModule) AdminDashboardController(c *fiber.Ctx) error {
	d, err := m.AdminDashboardRepository()
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "Failed to fetch admin dashboard.", nil, nil)
	}
	return utils.JSON(c, http.StatusOK, true, "Admin dashboard fetched.", d, nil)
}
