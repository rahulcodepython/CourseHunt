package category

import (
	"coursehunt/api/internals/generic"
	"coursehunt/api/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (m *CategoryModule) Routes(v1, protected fiber.Router) {
	v1.Get("/categories", m.ListController)

	categories := protected.Group("/categories", middlewares.PermissionGuard(generic.AdminCategoriesManage))
	categories.Post("", m.CreateController)
	categories.Patch("/:id", m.UpdateController)
	categories.Delete("/:id", m.DeleteController)
}
