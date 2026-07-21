package cart

import (
	"coursehunt/api/internals/generic"
	"coursehunt/api/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (m *CartModule) Routes(v1, protected fiber.Router) {
	cart := protected.Group("/carts", middlewares.PermissionGuard(generic.UserCartManage))
	cart.Get("", m.ListController)
	cart.Post("", m.AddController)
	cart.Delete("/:id", m.RemoveController)
	cart.Delete("", m.ClearController)
}
