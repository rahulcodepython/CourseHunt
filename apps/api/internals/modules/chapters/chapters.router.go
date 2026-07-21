package chapters

import (
	"coursehunt/api/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (m *ChaptersModule) Routes(v1, protected fiber.Router) {
	chapters := protected.Group("/chapters", middlewares.PermissionGuard("courses:manage"))
	chapters.Get("", m.ListController)
	chapters.Post("", m.CreateController)
	chapters.Patch("/:id", m.UpdateController)
	chapters.Delete("/:id", m.DeleteController)

	protected.Get("/chapters/inspect/:courseId", middlewares.PermissionGuard("courses:inspect"), m.InspectListController)
}
