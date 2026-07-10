package courses

import (
	"coursehunt-backend/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (m *CoursesModule) Routes(v1, protected fiber.Router) {
	// Public
	v1.Get("/courses", m.ListController)
	v1.Get("/courses/:slug", m.ReadLandingController)

	// Protected
	courses := protected.Group("/courses")
	courses.Post("", middlewares.PermissionGuard("courses:create"), m.CreateController)
	courses.Patch("/:id", middlewares.PermissionGuard("courses:update"), m.UpdateController)
	courses.Delete("/:id", middlewares.PermissionGuard("courses:delete"), m.DeleteController)
	courses.Get("/:id/study", m.ReadStudyController)

	// Ensure /me/enrolled doesn't conflict
	protected.Get("/me/enrolled", m.EnrolledController)
}
