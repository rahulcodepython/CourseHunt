package chapters

import (
	"coursehunt-backend/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (m *ChaptersModule) Routes(protected fiber.Router) {
	chapters := protected.Group("/chapters")
	chapters.Get("/course/:courseID", m.ListController)
	chapters.Post("/course/:courseID", middlewares.PermissionGuard("courses:update"), m.CreateController)
	chapters.Patch("/:id", middlewares.PermissionGuard("courses:update"), m.UpdateController)
	chapters.Delete("/:id", middlewares.PermissionGuard("courses:update"), m.DeleteController)
}
