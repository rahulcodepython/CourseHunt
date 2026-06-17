package routes

import (
	"coursehunt-backend/internals/handlers"
	"github.com/gofiber/fiber/v2"
)

func SetupWishlistRoutes(protected fiber.Router, h *handlers.WishlistHandler) {
	wishlist := protected.Group("/wishlist")
	wishlist.Get("", h.List)
	wishlist.Post("/course/:courseID", h.Add)
	wishlist.Delete("/course/:courseID", h.Remove)
}
