package category

import (
	"coursehunt/api/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (m *CategoryModule) Routes(v1, protected fiber.Router) {
	categories := protected.Group("/categories", middlewares.PermissionGuard("categories:manage"))
	categories.Get("", m.ListController)
	categories.Post("", m.CreateController)
	categories.Patch("/:id", m.UpdateController)
	categories.Delete("/:id", m.DeleteController)
}
