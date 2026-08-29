package dashboard

import (
	"coursehunt/server/internals/middlewares"
	"coursehunt/server/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (a *App) handleUserDashboard(c *fiber.Ctx) error {
	d, err := a.UserDashboard(c.Context(), middlewares.UserID(c))
	if err != nil {
		return err
	}
	return utils.OK(c, "User dashboard fetched.", d)
}

func (a *App) handleTutorDashboard(c *fiber.Ctx) error {
	d, err := a.TutorDashboard(c.Context(), middlewares.UserID(c))
	if err != nil {
		return err
	}
	return utils.OK(c, "Tutor dashboard fetched.", d)
}

func (a *App) handleAdminDashboard(c *fiber.Ctx) error {
	d, err := a.AdminDashboard(c.Context())
	if err != nil {
		return err
	}
	return utils.OK(c, "Admin dashboard fetched.", d)
}
