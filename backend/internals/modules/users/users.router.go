package users

import (
	"coursehunt-backend/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (m *UsersModule) Routes(protected fiber.Router) {
	users := protected.Group("/users")
	users.Post("/:id/roles/assign", middlewares.PermissionGuard("users:role:assign"), m.AssignRoleController)
	users.Post("/:id/roles/revoke", middlewares.PermissionGuard("users:role:revoke"), m.DeleteRoleController)
}
