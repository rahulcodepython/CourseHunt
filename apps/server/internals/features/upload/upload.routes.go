package upload

import (
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (a *App) RegisterRoutes(router fiber.Router, auth fiber.Handler) {
	g := router.Group("/v1/upload", auth, middlewares.RoleGuard(generic.RoleAdmin, generic.RoleTutor))
	g.Get("/signed/url", a.handleGetSignedURL)
}
