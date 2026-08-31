package coupons

import (
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (a *App) RegisterRoutes(router fiber.Router, auth fiber.Handler) {
	manage := middlewares.PermissionGuard(generic.PermAdminCouponsManage, generic.PermTutorCouponsManage)

	g := router.Group("/v1/coupons", auth)
	g.Get("/", manage, a.handleList)
	g.Post("/", manage, a.handleCreate)
	g.Patch("/:id", manage, a.handleUpdate)
	g.Delete("/:id", manage, a.handleDelete)
	g.Get("/check", a.handleCheck)
}
