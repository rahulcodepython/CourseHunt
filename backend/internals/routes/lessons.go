package routes

import (
	"coursehunt-backend/internals/handlers"
	"coursehunt-backend/internals/middlewares"
	"github.com/gofiber/fiber/v2"
)

func SetupLessonsRoutes(protected fiber.Router, h *handlers.LessonHandler) {
	lessons := protected.Group("/lessons")
	lessons.Get("/chapter/:chapterID", h.List)
	lessons.Post("/chapter/:chapterID", middlewares.PermissionGuard("courses:update"), h.Create)
	lessons.Patch("/:id", middlewares.PermissionGuard("courses:update"), h.Update)
	lessons.Delete("/:id", middlewares.PermissionGuard("courses:update"), h.Delete)

	lessons.Post("/:id/video", middlewares.PermissionGuard("courses:update"), h.UpsertVideoContent)
	lessons.Post("/:id/document", middlewares.PermissionGuard("courses:update"), h.UpsertDocumentContent)

	lessons.Get("/:id/content", h.Content)
	lessons.Post("/:id/complete", h.MarkComplete)

	lessons.Post("/:id/resources", middlewares.PermissionGuard("courses:update"), h.AddResource)
	lessons.Delete("/resources/:resourceID", middlewares.PermissionGuard("courses:update"), h.DeleteResource)
}
