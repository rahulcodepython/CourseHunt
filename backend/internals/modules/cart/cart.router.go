package cart

import (
	"coursehunt-backend/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (c *CartModule) Routes(protected fiber.Router) {
	cart := protected.Group("/carts", middlewares.PermissionGuard("cart:manage"))
	cart.Get("", c.ListController)
	cart.Post("", c.AddController)
	cart.Delete("/:id", c.RemoveController)
	cart.Delete("/clear", c.ClearController)
}
