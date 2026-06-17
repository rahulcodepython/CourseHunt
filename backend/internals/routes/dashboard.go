package routes

import (
	"coursehunt-backend/internals/handlers"
	"coursehunt-backend/internals/middlewares"
	"github.com/gofiber/fiber/v2"
)

func SetupDashboardRoutes(protected fiber.Router, h *handlers.DashboardHandler) {
	dashboard := protected.Group("/dashboard")
	dashboard.Get("/user", h.UserDashboard)
	dashboard.Get("/tutor", middlewares.PermissionGuard("dashboard:tutor"), h.TutorDashboard)
	dashboard.Get("/admin", middlewares.PermissionGuard("dashboard:admin"), h.AdminDashboard)
}
