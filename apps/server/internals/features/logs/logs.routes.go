package logs

import (
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (a *App) RegisterRoutes(router fiber.Router, auth fiber.Handler) {
	g := router.Group("/v1/logs", auth)
	g.Get("/", middlewares.RoleGuard(generic.RoleAdmin), a.handleList)
}
