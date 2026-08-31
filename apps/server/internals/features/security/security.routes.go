package security

import (
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (a *App) RegisterRoutes(router fiber.Router, auth fiber.Handler) {
	admin := middlewares.RoleGuard(generic.RoleAdmin)

	g := router.Group("/v1/security", auth, admin)
	g.Get("/events", a.handleListEvents)
	g.Get("/stats", a.handleStats)
}
