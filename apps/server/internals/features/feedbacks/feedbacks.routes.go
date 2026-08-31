package feedbacks

import (
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (a *App) RegisterRoutes(router fiber.Router, auth fiber.Handler) {
	// Public pinned feedbacks
	router.Get("/v1/feedbacks/pinned", a.handleListPinned)

	// Authenticated student feedback creation
	router.Post("/v1/feedbacks", auth, a.handleCreate)

	// Admin feedbacks inspection: strictly single permission PermAdminFeedbackInspect
	adminGuard := middlewares.PermissionGuard(generic.PermAdminFeedbackInspect)
	gAdmin := router.Group("/v1/admin/feedbacks", auth, adminGuard)
	gAdmin.Get("/", a.handleAdminList)
	gAdmin.Patch("/:id", a.handleAdminUpdate)
	gAdmin.Delete("/:id", a.handleAdminDelete)

	// Tutor feedbacks management: strictly single permission PermTutorFeedbackManage
	tutorGuard := middlewares.PermissionGuard(generic.PermTutorFeedbackManage)
	gTutor := router.Group("/v1/tutor/feedbacks", auth, tutorGuard)
	gTutor.Get("/", a.handleTutorList)
	gTutor.Delete("/:id", a.handleTutorDelete)
}
