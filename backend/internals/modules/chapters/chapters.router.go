package chapters

import (
	"coursehunt-backend/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (m *ChaptersModule) Routes(v1, protected fiber.Router) {
	chapters := protected.Group("/chapters", middlewares.PermissionGuard("courses:manage"))
	chapters.Get("", m.ListController)
	chapters.Post("", m.CreateController)
	chapters.Patch("/:id", m.UpdateController)
	chapters.Delete("/:id", m.DeleteController)
}
