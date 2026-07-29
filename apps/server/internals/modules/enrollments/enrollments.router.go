package enrollments

import (
	"coursehunt/api/internals/generic"
	"coursehunt/api/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (m *EnrollmentsModule) Routes(v1, protected fiber.Router) {
	protected.Get("/enrollments/:course_id", middlewares.PermissionGuard(generic.UserEnrollmentsRead, generic.AdminEnrollmentsInspect), m.ListController)
}
