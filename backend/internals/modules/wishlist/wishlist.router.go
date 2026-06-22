package wishlist

import (
	"github.com/gofiber/fiber/v2"
)

func (m *WishlistModule) Routes(protected fiber.Router) {
	wishlist := protected.Group("/wishlist")
	wishlist.Get("", m.ListController)
	wishlist.Post("/course/:courseID", m.CreateController)
	wishlist.Delete("/course/:courseID", m.DeleteController)
}
