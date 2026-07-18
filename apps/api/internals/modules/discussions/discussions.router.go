package discussions

import (
	"coursehunt/api/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (m *DiscussionsModule) Routes(v1, protected fiber.Router) {
	discussions := protected.Group("/discussions")

	// Regular User / Student Routes
	discussions.Get("", middlewares.PermissionGuard("discussions:read"), m.ListController)
	discussions.Get("/replies/:id", middlewares.PermissionGuard("discussions:read"), m.ListRepliesController)
	discussions.Post("", middlewares.PermissionGuard("discussions:write"), m.CreateController)
	discussions.Patch("/:id", middlewares.PermissionGuard("discussions:write"), m.UpdateController)
	discussions.Delete("/:id", middlewares.PermissionGuard("discussions:write"), m.DeleteController)

	// Tutor Routes
	discussions.Delete("/tutor/:id", middlewares.PermissionGuard("tutor:discussion:delete"), m.TutorDeleteController)

	// Admin Routes
	discussions.Get("/admin", middlewares.PermissionGuard("admin:discussion:read"), m.AdminListController)
	discussions.Delete("/admin/:id", middlewares.PermissionGuard("admin:discussion:delete"), m.AdminDeleteController)
}
