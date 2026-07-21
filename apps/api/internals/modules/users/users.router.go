package users

import (
	"coursehunt/api/internals/generic"
	"coursehunt/api/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (m *UsersModule) Routes(v1, protected fiber.Router) {
	users := protected.Group("/users")
	users.Get("/", middlewares.PermissionGuard(generic.AdminUsersList), m.ListController)
	users.Post("/:id/roles/assign", middlewares.PermissionGuard(generic.AdminUsersRoleAssign), m.AssignRoleController)
	users.Post("/:id/roles/revoke", middlewares.PermissionGuard(generic.AdminUsersRoleRevoke), m.DeleteRoleController)

	profile := protected.Group("/profile")
	profile.Get("/user", middlewares.PermissionGuard(generic.UserProfile), m.ReadUserProfileController)
	profile.Post("/user", middlewares.PermissionGuard(generic.UserProfile), m.UpsertUserProfileController)
	profile.Get("/tutor", middlewares.PermissionGuard(generic.TutorProfile), m.ReadTutorProfileController)
	profile.Post("/tutor", middlewares.PermissionGuard(generic.TutorProfile), m.UpsertTutorProfileController)
	profile.Get("/admin", middlewares.PermissionGuard(generic.AdminProfile), m.AdminListProfilesController)
}
