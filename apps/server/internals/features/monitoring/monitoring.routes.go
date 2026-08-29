package monitoring

import (
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (a *App) RegisterRoutes(router fiber.Router, auth fiber.Handler) {
	router.Get("/v1/health", a.handleHealth)

	g := router.Group("/v1/monitoring", auth)
	g.Get("/", middlewares.RoleGuard(generic.RoleAdmin), a.handleSnapshot)
}
