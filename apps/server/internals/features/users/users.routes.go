package users

import (
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (a *App) RegisterRoutes(router fiber.Router, auth fiber.Handler) {
	listUsers := middlewares.PermissionGuard(generic.PermAdminUsersList)
	assignRole := middlewares.PermissionGuard(generic.PermAdminUsersRoleAssign)
	revokeRole := middlewares.PermissionGuard(generic.PermAdminUsersRoleRevoke)
	adminProfile := middlewares.PermissionGuard(generic.PermAdminProfile)

	gUsers := router.Group("/v1/users", auth)
	gUsers.Get("/", listUsers, a.handleList)
	gUsers.Post("/:id/roles/assign", assignRole, a.handleAssignRole)
	gUsers.Post("/:id/roles/revoke", revokeRole, a.handleDeleteRole)

	gProfile := router.Group("/v1/profile", auth)
	gProfile.Get("/user", a.handleReadProfile)
	gProfile.Post("/user", a.handleUpsertProfile)
	gProfile.Get("/tutor", a.handleReadProfile)
	gProfile.Post("/tutor", a.handleUpsertProfile)
	gProfile.Get("/admin", adminProfile, a.handleAdminListProfiles)
}
