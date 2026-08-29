package enrollments

import (
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (a *App) RegisterRoutes(router fiber.Router, auth fiber.Handler) {
	g := router.Group("/v1/enrollments", auth)
	g.Get("/", middlewares.ScopeGuard(generic.PermAdminEnrollmentsInspect), a.handleList)
	g.Post("/:userId/:courseId/revoke", middlewares.PermissionGuard(generic.PermAdminRevokeCourse), a.handleRevoke)
	g.Post("/:userId/:courseId/regain", middlewares.PermissionGuard(generic.PermAdminRevokeCourse), a.handleRegain)
}
