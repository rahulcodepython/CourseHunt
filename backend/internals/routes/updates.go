package routes

import (
	"coursehunt-backend/internals/handlers"
	"coursehunt-backend/internals/middlewares"
	"github.com/gofiber/fiber/v2"
)

func SetupUpdatesRoutes(v1, protected fiber.Router, h *handlers.UpdateHandler) {
	updates := protected.Group("/updates")
	updates.Get("/feed", h.Feed) // user feed

	// Admin CRUD
	updates.Get("", middlewares.PermissionGuard("updates:read"), h.List)
	updates.Post("", middlewares.PermissionGuard("updates:create"), h.Create)
	updates.Patch("/:id", middlewares.PermissionGuard("updates:update"), h.Update)
	updates.Delete("/:id", middlewares.PermissionGuard("updates:delete"), h.Delete)
}
