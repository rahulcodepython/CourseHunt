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
	gAdmin.Get("/lesson/:lessonId", adminRead, a.handleAdminList)
	gAdmin.Get("/replies/:id", adminRead, a.handleAdminListReplies)
	gAdmin.Post("/", adminWrite, a.handleAdminCreate)
	gAdmin.Patch("/:id", adminWrite, a.handleAdminUpdate)
	gAdmin.Delete("/:id", adminDelete, a.handleAdminDelete)

	// Tutor Discussions
	tutorRead := middlewares.PermissionGuard(generic.PermTutorDiscussionRead)
	tutorWrite := middlewares.PermissionGuard(generic.PermTutorDiscussionWrite)
	tutorDelete := middlewares.PermissionGuard(generic.PermTutorDiscussionDelete)

	gTutor := router.Group("/v1/tutor/discussions", auth)
	gTutor.Get("/lesson/:lessonId", tutorRead, a.handleTutorList)
	gTutor.Get("/replies/:id", tutorRead, a.handleTutorListReplies)
	gTutor.Post("/", tutorWrite, a.handleTutorCreate)
	gTutor.Patch("/:id", tutorWrite, a.handleTutorUpdate)
	gTutor.Delete("/:id", tutorDelete, a.handleTutorDelete)

	// Student Discussions
	gStudent := router.Group("/v1/discussions", auth)
	gStudent.Get("/lesson/:lessonId", a.handleStudentList)
	gStudent.Get("/:lessonId", a.handleStudentList)
	gStudent.Get("/replies/:id", a.handleStudentListReplies)
	gStudent.Post("/", a.handleStudentCreate)
	gStudent.Patch("/:id", a.handleStudentUpdate)
	gStudent.Delete("/:id", a.handleStudentDelete)
}
