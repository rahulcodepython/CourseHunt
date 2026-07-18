package dashboard

import (
	"coursehunt-backend/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (m *DashboardModule) UserDashboardController(c *fiber.Ctx) error {
	d, err := m.UserDashboardRepository(utils.GetUserID(c))
	if err != nil {
		return utils.InternalError(c, "Failed to fetch user dashboard.", err)
	}
	return utils.OK(c, "User dashboard fetched.", d)
}

func (m *DashboardModule) TutorDashboardController(c *fiber.Ctx) error {
	d, err := m.TutorDashboardRepository(utils.GetUserID(c))
	if err != nil {
		return utils.InternalError(c, "Failed to fetch tutor dashboard.", err)
	}
	return utils.OK(c, "Tutor dashboard fetched.", d)
}

func (m *DashboardModule) AdminDashboardController(c *fiber.Ctx) error {
	d, err := m.AdminDashboardRepository()
	if err != nil {
		return utils.InternalError(c, "Failed to fetch admin dashboard.", err)
	}
	return utils.OK(c, "Admin dashboard fetched.", d)
}
