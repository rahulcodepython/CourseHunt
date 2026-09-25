package notes

import (
	"coursehunt/server/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (a *App) RegisterRoutes(router fiber.Router, auth fiber.Handler) {
	g := router.Group("/v1/notes", auth)
	g.Get("/", a.handleRead)
	g.Post("/", a.handleUpsert)
	g.Patch("/:id", middlewares.ValidateUUIDParams("id"), a.handleUpdate)
	g.Delete("/:id", middlewares.ValidateUUIDParams("id"), a.handleDelete)
}
