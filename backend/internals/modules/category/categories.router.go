package category

import (
	"coursehunt-backend/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (c *CategoryModule) Routes(v1, protected fiber.Router) {
	categories := protected.Group("/categories", middlewares.PermissionGuard("categories:manage"))
	categories.Get("", c.ListController)
	categories.Post("", c.CreateController)
	categories.Patch("/:id", c.UpdateController)
	categories.Delete("/:id", c.DeleteController)
}
