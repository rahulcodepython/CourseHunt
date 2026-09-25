package discussions

import (
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (a *App) RegisterRoutes(router fiber.Router, auth fiber.Handler) {
	// Admin Discussions
	adminRead := middlewares.PermissionGuard(generic.PermAdminDiscussionRead)
	adminWrite := middlewares.PermissionGuard(generic.PermAdminDiscussionWrite)
	adminDelete := middlewares.PermissionGuard(generic.PermAdminDiscussionDelete)

	gAdmin := router.Group("/v1/admin/discussions", auth)
	gAdmin.Get("/lesson/:lessonId", adminRead, middlewares.ValidateUUIDParams("lessonId"), a.handleList(generic.ScopeAdmin))
	gAdmin.Get("/replies/:id", adminRead, middlewares.ValidateUUIDParams("id"), a.handleListReplies(generic.ScopeAdmin))
	gAdmin.Post("/", adminWrite, a.handleCreate(generic.ScopeAdmin))
	gAdmin.Patch("/:id", adminWrite, middlewares.ValidateUUIDParams("id"), a.handleUpdate(generic.ScopeAdmin))
	gAdmin.Delete("/:id", adminDelete, middlewares.ValidateUUIDParams("id"), a.handleDelete(generic.ScopeAdmin))

	// Tutor Discussions
	tutorRead := middlewares.PermissionGuard(generic.PermTutorDiscussionRead)
	tutorWrite := middlewares.PermissionGuard(generic.PermTutorDiscussionWrite)
	tutorDelete := middlewares.PermissionGuard(generic.PermTutorDiscussionDelete)

	gTutor := router.Group("/v1/tutor/discussions", auth)
	gTutor.Get("/lesson/:lessonId", tutorRead, middlewares.ValidateUUIDParams("lessonId"), a.handleList(generic.ScopeTutor))
	gTutor.Get("/replies/:id", tutorRead, middlewares.ValidateUUIDParams("id"), a.handleListReplies(generic.ScopeTutor))
	gTutor.Post("/", tutorWrite, a.handleCreate(generic.ScopeTutor))
	gTutor.Patch("/:id", tutorWrite, middlewares.ValidateUUIDParams("id"), a.handleUpdate(generic.ScopeTutor))
	gTutor.Delete("/:id", tutorDelete, middlewares.ValidateUUIDParams("id"), a.handleDelete(generic.ScopeTutor))

	// Student Discussions
	gStudent := router.Group("/v1/discussions", auth)
	gStudent.Get("/lesson/:lessonId", middlewares.ValidateUUIDParams("lessonId"), a.handleList(generic.ScopeUser))
	gStudent.Get("/replies/:id", middlewares.ValidateUUIDParams("id"), a.handleListReplies(generic.ScopeUser))
	gStudent.Post("/", a.handleCreate(generic.ScopeUser))
	gStudent.Patch("/:id", middlewares.ValidateUUIDParams("id"), a.handleUpdate(generic.ScopeUser))
	gStudent.Delete("/:id", middlewares.ValidateUUIDParams("id"), a.handleDelete(generic.ScopeUser))
}
