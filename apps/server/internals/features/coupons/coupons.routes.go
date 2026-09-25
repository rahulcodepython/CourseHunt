package coupons

import (
	"time"

	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (a *App) RegisterRoutes(router fiber.Router, auth fiber.Handler) {
	// Admin coupon management: strictly single permission PermAdminCouponsManage
	adminGuard := middlewares.PermissionGuard(generic.PermAdminCouponsManage)
	gAdmin := router.Group("/v1/admin/coupons", auth, adminGuard)
	gAdmin.Get("/", a.handleAdminList)
	gAdmin.Post("/", a.handleAdminCreate)
	gAdmin.Patch("/:id", middlewares.ValidateUUIDParams("id"), a.handleAdminUpdate)
	gAdmin.Delete("/:id", middlewares.ValidateUUIDParams("id"), a.handleAdminDelete)

	// Tutor coupon management: strictly single permission PermTutorCouponsManage
	tutorGuard := middlewares.PermissionGuard(generic.PermTutorCouponsManage)
	gTutor := router.Group("/v1/tutor/coupons", auth, tutorGuard)
	gTutor.Get("/", a.handleTutorList)
	gTutor.Post("/", a.handleTutorCreate)
	gTutor.Patch("/:id", middlewares.ValidateUUIDParams("id"), a.handleTutorUpdate)
	gTutor.Delete("/:id", middlewares.ValidateUUIDParams("id"), a.handleTutorDelete)

	// Public / Student coupon checkout validity check
	router.Get("/v1/coupons/check", middlewares.TieredRouteRateLimiter(a.Cache.Client(), 10, 1*time.Minute, "coupon_check"), a.handleCheck)
}
