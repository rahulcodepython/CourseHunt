package coupons

import (
	"coursehunt/api/internals/generic"
	"coursehunt/api/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (m *CouponsModule) Routes(v1, protected fiber.Router) {
	// Admin actions
	coupons := protected.Group("/coupons", middlewares.PermissionGuard(generic.AdminCouponsManage))
	coupons.Get("", m.ListController)
	coupons.Post("", m.CreateController)
	coupons.Patch("/:id", m.UpdateController)
	coupons.Delete("/:id", m.DeleteController)

	// Protected — used in checkout flow
	protected.Get("/coupons/check", middlewares.PermissionGuard(generic.UserTransactionsInitiate), m.CheckController)
}
