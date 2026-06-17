package routes

import (
	"coursehunt-backend/internals/handlers"
	"coursehunt-backend/internals/middlewares"
	"github.com/gofiber/fiber/v2"
)

func SetupEnrollmentsRoutes(protected fiber.Router, h *handlers.EnrollmentHandler) {
	enrollments := protected.Group("/enrollments")
	enrollments.Get("", middlewares.PermissionGuard("enrollments:read"), h.List)
	enrollments.Post("/manual/course/:courseID", middlewares.PermissionGuard("enrollments:create"), h.ManualEnroll)
}
