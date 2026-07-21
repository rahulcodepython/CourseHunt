package wishlist

import (
	"coursehunt/api/internals/generic"
	"coursehunt/api/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (m *WishlistModule) Routes(v1, protected fiber.Router) {
	wishlist := protected.Group("/wishlist", middlewares.PermissionGuard(generic.UserWishlistManage))
	wishlist.Get("", m.ListController)
	wishlist.Post("", m.CreateController)
	wishlist.Delete("/:id", m.DeleteController)
}
