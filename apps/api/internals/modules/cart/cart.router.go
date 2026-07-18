package cart

import (
	"coursehunt-backend/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (m *CartModule) Routes(v1, protected fiber.Router) {
	cart := protected.Group("/carts", middlewares.PermissionGuard("cart:manage"))
	cart.Get("", m.ListController)
	cart.Post("", m.AddController)
	cart.Delete("/:id", m.RemoveController)
	cart.Delete("/clear", m.ClearController)
}
