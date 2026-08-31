package faqs

import (
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (a *App) RegisterRoutes(router fiber.Router, auth fiber.Handler) {
	// Public FAQs list
	router.Get("/v1/faqs/public", a.handlePublicList)

	// Admin FAQ inspection: strictly single permission PermAdminCoursesInspect
	adminGuard := middlewares.PermissionGuard(generic.PermAdminCoursesInspect)
	gAdmin := router.Group("/v1/admin/faqs", auth, adminGuard)
	gAdmin.Get("/", a.handleAdminList)

	// Tutor FAQ management: strictly single permission PermTutorCoursesManage
	tutorGuard := middlewares.PermissionGuard(generic.PermTutorCoursesManage)
	gTutor := router.Group("/v1/tutor/faqs", auth, tutorGuard)
	gTutor.Get("/", a.handleTutorList)
	gTutor.Post("/", a.handleCreate)
	gTutor.Patch("/:id", a.handleUpdate)
	gTutor.Delete("/:id", a.handleDelete)
}
