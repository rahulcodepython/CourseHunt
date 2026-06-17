package routes

import (
	"coursehunt-backend/internals/handlers"
	"coursehunt-backend/internals/middlewares"
	"github.com/gofiber/fiber/v2"
)

func SetupChaptersRoutes(protected fiber.Router, h *handlers.ChapterHandler) {
	chapters := protected.Group("/chapters")
	chapters.Get("/course/:courseID", h.List)
	chapters.Post("/course/:courseID", middlewares.PermissionGuard("courses:update"), h.Create)
	chapters.Patch("/:id", middlewares.PermissionGuard("courses:update"), h.Update)
	chapters.Delete("/:id", middlewares.PermissionGuard("courses:update"), h.Delete)
}
