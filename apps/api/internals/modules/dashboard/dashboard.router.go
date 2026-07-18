package dashboard

import (
	"coursehunt/api/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (m *DashboardModule) Routes(v1, protected fiber.Router) {
	dashboard := protected.Group("/dashboard")
	dashboard.Get("/user", middlewares.PermissionGuard("dashboard:student"), m.UserDashboardController)
	dashboard.Get("/tutor", middlewares.PermissionGuard("dashboard:tutor"), m.TutorDashboardController)
	dashboard.Get("/admin", middlewares.PermissionGuard("dashboard:admin"), m.AdminDashboardController)
}
