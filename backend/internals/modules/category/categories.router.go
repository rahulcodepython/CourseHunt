package categories

import (
	"coursehunt-backend/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (c *CategoryModule) Routes(v1, protected fiber.Router) {
	v1.Get("/categories", c.ListController)

	categories := protected.Group("/categories", middlewares.PermissionGuard("categories:manage"))
	categories.Post("", c.CreateController)
	categories.Delete("/:id", c.DeleteController)
	categories.Post("/:id/subcategories", c.CreateSubController)
	categories.Delete("/subcategories/:subID", c.DeleteSubController)
}
