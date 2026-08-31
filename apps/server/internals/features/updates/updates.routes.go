package updates

import (
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (a *App) RegisterRoutes(router fiber.Router, auth fiber.Handler) {
	manage := middlewares.PermissionGuard(generic.PermTutorUpdatesManage, generic.PermAdminUpdatesManage)

	g := router.Group("/v1/updates", auth)
	g.Get("/feed", a.handleFeed)
	g.Get("/", manage, a.handleList)
	g.Post("/", manage, a.handleCreate)
	g.Patch("/:id", manage, a.handleUpdate)
	g.Delete("/:id", manage, a.handleDelete)
}
