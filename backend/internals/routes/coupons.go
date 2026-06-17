package routes

import (
	"coursehunt-backend/internals/handlers"
	"coursehunt-backend/internals/middlewares"
	"github.com/gofiber/fiber/v2"
)

func SetupCouponsRoutes(protected fiber.Router, h *handlers.CouponHandler) {
	coupons := protected.Group("/coupons")
	coupons.Get("/check", h.Check)

	// Admin actions
	coupons.Get("", middlewares.PermissionGuard("coupons:read"), h.List)
	coupons.Post("", middlewares.PermissionGuard("coupons:create"), h.Create)
	coupons.Patch("/:id", middlewares.PermissionGuard("coupons:update"), h.Update)
	coupons.Delete("/:id", middlewares.PermissionGuard("coupons:delete"), h.Delete)
}
