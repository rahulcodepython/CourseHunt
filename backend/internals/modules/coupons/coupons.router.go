package coupons

import (
	"coursehunt-backend/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (m *CouponsModule) Routes(protected fiber.Router) {
	coupons := protected.Group("/coupons")
	coupons.Get("/check", m.CheckController)

	// Admin actions
	coupons.Get("", middlewares.PermissionGuard("coupons:read"), m.ListController)
	coupons.Post("", middlewares.PermissionGuard("coupons:create"), m.CreateController)
	coupons.Patch("/:id", middlewares.PermissionGuard("coupons:update"), m.UpdateController)
	coupons.Delete("/:id", middlewares.PermissionGuard("coupons:delete"), m.DeleteController)
}
