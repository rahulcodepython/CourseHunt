package routes

import (
	"coursehunt-backend/internals/handlers"
	"coursehunt-backend/internals/middlewares"
	"github.com/gofiber/fiber/v2"
)

func SetupUsersRoutes(protected fiber.Router, h *handlers.UserHandler) {
	protected.Get("/me", h.Me)

	users := protected.Group("/users")
	users.Get("", middlewares.PermissionGuard("users:read"), h.List)
	users.Post("/:id/roles/assign", middlewares.PermissionGuard("users:role:assign"), h.AssignRole)
	users.Post("/:id/roles/revoke", middlewares.PermissionGuard("users:role:revoke"), h.RevokeRole)
}
