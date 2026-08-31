package dashboard

import (
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (a *App) RegisterRoutes(router fiber.Router, auth fiber.Handler) {
	g := router.Group("/v1/dashboard", auth)
	g.Get("/user", a.handleUserDashboard)
	g.Get("/tutor", middlewares.RoleGuard(generic.RoleTutor), a.handleTutorDashboard)
	g.Get("/admin", middlewares.RoleGuard(generic.RoleAdmin), a.handleAdminDashboard)
}
