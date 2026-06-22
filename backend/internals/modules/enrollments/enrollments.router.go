package enrollments

import (
	"coursehunt-backend/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (m *EnrollmentsModule) Routes(protected fiber.Router) {
	enrollments := protected.Group("/enrollments")
	enrollments.Get("", middlewares.PermissionGuard("enrollments:read"), m.ListController)
	enrollments.Post("/manual/course/:courseID", middlewares.PermissionGuard("enrollments:create"), m.CreateController)
}
