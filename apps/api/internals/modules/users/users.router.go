package users

import (
	"coursehunt/api/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (m *UsersModule) Routes(v1, protected fiber.Router) {
	users := protected.Group("/users")
	users.Get("/", middlewares.PermissionGuard("users:list"), m.ListController)
	users.Post("/:id/roles/assign", middlewares.PermissionGuard("users:role:assign"), m.AssignRoleController)
	users.Post("/:id/roles/revoke", middlewares.PermissionGuard("users:role:revoke"), m.DeleteRoleController)

	profile := protected.Group("/profile")
	profile.Get("/user", middlewares.PermissionGuard("profile:student"), m.ReadUserProfileController)
	profile.Post("/user", middlewares.PermissionGuard("profile:student"), m.UpsertUserProfileController)
	profile.Get("/tutor", middlewares.PermissionGuard("profile:tutor"), m.ReadTutorProfileController)
	profile.Post("/tutor", middlewares.PermissionGuard("profile:tutor"), m.UpsertTutorProfileController)
	profile.Get("/admin", middlewares.PermissionGuard("profile:admin"), m.AdminListProfilesController)
}
