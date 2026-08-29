package categories

import (
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (a *App) RegisterRoutes(router fiber.Router, auth fiber.Handler) {
	router.Get("/v1/categories", a.handleList)

	manage := middlewares.PermissionGuard(generic.PermAdminCategoriesManage)
	g := router.Group("/v1/categories", auth, manage)
	g.Post("/", a.handleCreate)
	g.Patch("/:id", a.handleUpdate)
	g.Delete("/:id", a.handleDelete)
}
