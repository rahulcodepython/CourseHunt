package wishlist

import (
	"github.com/gofiber/fiber/v2"
)

func (a *App) RegisterRoutes(router fiber.Router, auth fiber.Handler) {
	g := router.Group("/v1/wishlist", auth)
	g.Get("/", a.handleList)
	g.Post("/", a.handleCreate)
	g.Delete("/:id", a.handleDelete)
	g.Delete("/", a.handleClear)
}
