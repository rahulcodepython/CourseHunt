package discussions

import (
	"coursehunt/api/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (m *DiscussionsModule) Routes(v1, protected fiber.Router) {
	discussions := protected.Group("/discussions")

	// Student Routes
	student := discussions.Group("/student")
	student.Get("/:lessonId", middlewares.PermissionGuard("student:discussion:read"), m.StudentListController)
	student.Get("/replies/:id", middlewares.PermissionGuard("student:discussion:read"), m.StudentListRepliesController)
	student.Post("", middlewares.PermissionGuard("student:discussion:write"), m.StudentCreateController)
	student.Patch("/:id", middlewares.PermissionGuard("student:discussion:write"), m.StudentUpdateController)
	student.Delete("/:id", middlewares.PermissionGuard("student:discussion:write"), m.StudentDeleteController)

	// Tutor Routes
	tutor := discussions.Group("/tutor")
	tutor.Get("/:lessonId", middlewares.PermissionGuard("tutor:discussion:read"), m.TutorListController)
	tutor.Get("/replies/:id", middlewares.PermissionGuard("tutor:discussion:read"), m.TutorListRepliesController)
	tutor.Post("", middlewares.PermissionGuard("tutor:discussion:write"), m.TutorCreateController)
	tutor.Patch("/:id", middlewares.PermissionGuard("tutor:discussion:write"), m.TutorUpdateController)
	tutor.Delete("/:id", middlewares.PermissionGuard("tutor:discussion:delete"), m.TutorDeleteController)

	// Admin Routes
	admin := discussions.Group("/admin")
	admin.Get("/:lessonId", middlewares.PermissionGuard("admin:discussion:read"), m.AdminListController)
	admin.Get("/replies/:id", middlewares.PermissionGuard("admin:discussion:read"), m.AdminListRepliesController)
	admin.Delete("/:id", middlewares.PermissionGuard("admin:discussion:delete"), m.AdminDeleteController)
}
