package dashboard

import (
	"coursehunt/api/internals/generic"
	"coursehunt/api/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (m *DashboardModule) Routes(v1, protected fiber.Router) {
	dashboard := protected.Group("/dashboard")
	dashboard.Get("/user", middlewares.PermissionGuard(generic.EnrolledDashboard), m.UserDashboardController)
	dashboard.Get("/tutor", middlewares.PermissionGuard(generic.TutorDashboard), m.TutorDashboardController)
	dashboard.Get("/admin", middlewares.PermissionGuard(generic.AdminDashboard), m.AdminDashboardController)
}
