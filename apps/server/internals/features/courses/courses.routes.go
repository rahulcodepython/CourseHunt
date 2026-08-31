package courses

import (
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (a *App) RegisterRoutes(router fiber.Router, auth fiber.Handler) {
	// Public / Student courses
	router.Get("/v1/courses", a.handlePublicList)
	router.Get("/v1/courses/course/:slug", a.handlePublicSingle)

	gAuth := router.Group("/v1/courses", auth)
	gAuth.Get("/:id/study", a.handleStudy)
	gAuth.Get("/enrolled", a.handleEnrolledList)
	gAuth.Post("/:id/enroll", a.handleEnrollFree)

	// Admin course inspection: strictly single permission PermAdminCoursesInspect
	adminGuard := middlewares.PermissionGuard(generic.PermAdminCoursesInspect)
	gAdmin := router.Group("/v1/admin/courses", auth, adminGuard)
	gAdmin.Get("/", a.handleAdminList)
	gAdmin.Get("/:id", a.handleAdminGetByID)

	// Tutor course authoring: strictly single permission PermTutorCoursesManage
	tutorGuard := middlewares.PermissionGuard(generic.PermTutorCoursesManage)
	gTutor := router.Group("/v1/tutor/courses", auth, tutorGuard)
	gTutor.Get("/", a.handleTutorList)
	gTutor.Get("/:id", a.handleTutorGetByID)
	gTutor.Post("/", a.handleCreate)
	gTutor.Patch("/:id", a.handleUpdate)
	gTutor.Delete("/:id", a.handleDelete)
}
