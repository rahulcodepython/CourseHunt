package routes

import (
	"coursehunt-backend/internals/handlers"
	"coursehunt-backend/internals/middlewares"
	"github.com/gofiber/fiber/v2"
)

func SetupProfileRoutes(protected fiber.Router, h *handlers.ProfileHandler) {
	profile := protected.Group("/profile")

	// User profiles
	profile.Get("/user", h.GetUser)
	profile.Post("/user", h.UpsertUser)

	// Tutor profiles
	profile.Get("/tutor/:id", h.GetTutor)
	profile.Post("/tutor", middlewares.PermissionGuard("dashboard:tutor"), h.UpsertTutor)
}
