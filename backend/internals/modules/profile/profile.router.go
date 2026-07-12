package profile

import (
	"coursehunt-backend/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (m *ProfileModule) Routes(protected fiber.Router) {
	profile := protected.Group("/profile")

	// Student profile (get, update)
	profile.Get("/user", middlewares.PermissionGuard("profile:student"), m.ReadUserProfileController)
	profile.Post("/user", middlewares.PermissionGuard("profile:student"), m.UpsertUserProfileController)

	// Tutor profile (get, update)
	profile.Get("/tutor", middlewares.PermissionGuard("profile:tutor"), m.ReadTutorProfileController)
	profile.Post("/tutor", middlewares.PermissionGuard("profile:tutor"), m.UpsertTutorProfileController)

	// Admin (get all profiles)
	profile.Get("/admin", middlewares.PermissionGuard("profile:admin"), m.AdminListProfilesController)
}
