package chapters

import (
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (a *App) RegisterRoutes(router fiber.Router, auth fiber.Handler) {
	inspect := middlewares.PermissionGuard(generic.PermTutorCoursesManage, generic.PermAdminCoursesInspect)
	manage := middlewares.PermissionGuard(generic.PermTutorCoursesManage)

	g := router.Group("/v1/chapters", auth)
	g.Get("/", inspect, a.handleList)
	g.Post("/", manage, a.handleCreate)
	g.Patch("/:id", manage, a.handleUpdate)
	g.Delete("/:id", manage, a.handleDelete)
}
