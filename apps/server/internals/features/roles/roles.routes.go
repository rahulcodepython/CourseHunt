package roles

import (
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (a *App) RegisterRoutes(router fiber.Router, auth fiber.Handler) {
	read := middlewares.PermissionGuard(generic.PermAdminRolesRead)
	create := middlewares.PermissionGuard(generic.PermAdminRolesCreate)
	update := middlewares.PermissionGuard(generic.PermAdminRolesUpdate)
	deleteRole := middlewares.PermissionGuard(generic.PermAdminRolesDelete)

	g := router.Group("/v1/roles", auth)
	g.Get("/", read, a.handleListRoles)
	g.Post("/", create, a.handleCreateRole)
	g.Put("/:id", update, a.handleUpdateRole)
	g.Delete("/:id", deleteRole, a.handleDeleteRole)
	g.Get("/:id/permissions", read, a.handleGetRolePermissions)
	g.Put("/:id/permissions", update, a.handleSetRolePermissions)

	router.Get("/v1/permissions", auth, read, a.handleListPermissions)
}
