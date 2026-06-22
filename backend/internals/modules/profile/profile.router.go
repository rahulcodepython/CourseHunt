package profile

import (
	"coursehunt-backend/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (m *ProfileModule) Routes(protected fiber.Router) {
	profile := protected.Group("/profile")

	// User profiles
	profile.Get("/user", m.ReadUserProfileController)
	profile.Post("/user", m.UpsertUserProfileController)

	// Tutor profiles
	profile.Get("/tutor/:id", m.ReadTutorProfileController)
	profile.Post("/tutor", middlewares.PermissionGuard("dashboard:tutor"), m.UpsertTutorProfileController)
}
