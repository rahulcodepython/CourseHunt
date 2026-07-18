package enrollments

import (
	"coursehunt/api/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (m *EnrollmentsModule) Routes(v1, protected fiber.Router) {
	enrollments := protected.Group("/enrollments")
	enrollments.Get("", middlewares.PermissionGuard("enrollments:read"), m.ListController)
	enrollments.Get("/inspect", middlewares.PermissionGuard("enrollments:inspect"), m.InspectController)
}
