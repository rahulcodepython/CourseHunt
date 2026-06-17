package routes

import (
	"coursehunt-backend/internals/handlers"
	"github.com/gofiber/fiber/v2"
)

func SetupCartRoutes(protected fiber.Router, h *handlers.CartHandler) {
	cart := protected.Group("/cart")
	cart.Get("", h.List)
	cart.Post("/course/:courseID", h.Add)
	cart.Delete("/course/:courseID", h.Remove)
	cart.Delete("", h.Clear)
}
