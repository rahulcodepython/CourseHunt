package enrollments

import (
	"coursehunt/api/internals/generic"
	"coursehunt/api/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (m *EnrollmentsModule) Routes(v1, protected fiber.Router) {
	enrollments := protected.Group("/enrollments/:course_id")
	enrollments.Get("", middlewares.PermissionGuard(generic.UserEnrollmentsRead), m.ListController)
	enrollments.Get("/inspect", middlewares.PermissionGuard(generic.AdminEnrollmentsInspect), m.InspectController)
}
