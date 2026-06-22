package users

import (
	"coursehunt-backend/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (m *UsersModule) Routes(protected fiber.Router) {
	protected.Get("/me", m.MeController)

	users := protected.Group("/users")
	users.Get("", middlewares.PermissionGuard("users:read"), m.ListController)
	users.Post("/:id/roles/assign", middlewares.PermissionGuard("users:role:assign"), m.AssignRoleController)
	users.Post("/:id/roles/revoke", middlewares.PermissionGuard("users:role:revoke"), m.DeleteRoleController)
}
