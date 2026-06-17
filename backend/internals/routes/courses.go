package routes

import (
	"coursehunt-backend/internals/handlers"
	"coursehunt-backend/internals/middlewares"
	"github.com/gofiber/fiber/v2"
)

func SetupCoursesRoutes(v1, protected fiber.Router, h *handlers.CourseHandler) {
	// Public
	v1.Get("/courses", h.List)
	v1.Get("/courses/:slug", h.Landing)

	// Protected
	courses := protected.Group("/courses")
	courses.Post("", middlewares.PermissionGuard("courses:create"), h.Create)
	courses.Patch("/:id", middlewares.PermissionGuard("courses:update"), h.Update)
	courses.Delete("/:id", middlewares.PermissionGuard("courses:delete"), h.Delete)
	courses.Get("/:id/study", h.Study)
	protected.Get("/me/enrolled", h.Enrolled)
}
