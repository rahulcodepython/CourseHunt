package feedbacks

import (
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (a *App) RegisterRoutes(router fiber.Router, auth fiber.Handler) {
	router.Get("/v1/feedbacks/pinned", a.handleListPinned)

	inspect := middlewares.PermissionGuard(generic.PermAdminFeedbackInspect, generic.PermTutorFeedbackManage)
	adminOnly := middlewares.PermissionGuard(generic.PermAdminFeedbackInspect)

	g := router.Group("/v1/feedbacks", auth)
	g.Post("/", a.handleCreate)
	g.Get("/", inspect, a.handleList)
	g.Patch("/:id", adminOnly, a.handleUpdate)
	g.Delete("/:id", inspect, a.handleDelete)
}
