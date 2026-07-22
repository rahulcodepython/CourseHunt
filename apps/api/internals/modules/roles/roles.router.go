package roles

import (
	"coursehunt/api/internals/generic"
	"coursehunt/api/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (m *RolesModule) Routes(v1, protected fiber.Router) {
	roles := protected.Group("/roles")
	roles.Get("/", middlewares.PermissionGuard(generic.AdminRolesRead), m.ListRolesController)
	roles.Post("/", middlewares.PermissionGuard(generic.AdminRolesCreate), m.CreateRoleController)
	roles.Put("/:id", middlewares.PermissionGuard(generic.AdminRolesUpdate), m.UpdateRoleController)
	roles.Delete("/:id", middlewares.PermissionGuard(generic.AdminRolesDelete), m.DeleteRoleController)
	roles.Get("/:id/permissions", middlewares.PermissionGuard(generic.AdminRolesRead), m.GetRolePermissionsController)
	roles.Put("/:id/permissions", middlewares.PermissionGuard(generic.AdminRolesUpdate), m.SetRolePermissionsController)

	permissions := protected.Group("/permissions")
	permissions.Get("/", middlewares.PermissionGuard(generic.AdminRolesRead), m.ListPermissionsController)
}
