package notes

import "github.com/gofiber/fiber/v2"

func (a *App) RegisterRoutes(router fiber.Router, auth fiber.Handler) {
	g := router.Group("/v1/notes", auth)
	g.Get("/", a.handleRead)
	g.Post("/", a.handleUpsert)
	g.Patch("/:id", a.handleUpdate)
	g.Delete("/:id", a.handleDelete)
}
