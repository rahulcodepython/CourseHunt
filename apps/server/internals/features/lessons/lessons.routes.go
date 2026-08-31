package lessons

import (
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (a *App) RegisterRoutes(router fiber.Router, auth fiber.Handler) {
	// Admin lessons inspection: strictly single permission PermAdminCoursesInspect
	adminGuard := middlewares.PermissionGuard(generic.PermAdminCoursesInspect)
	gAdmin := router.Group("/v1/admin/lessons", auth, adminGuard)
	gAdmin.Get("/", a.handleAdminList)
	gAdmin.Get("/:id/content", a.handleAdminReadContent)
	gAdmin.Get("/:id/resources", a.handleAdminReadResources)

	// Tutor lessons management: strictly single permission PermTutorCoursesManage
	tutorGuard := middlewares.PermissionGuard(generic.PermTutorCoursesManage)
	gTutor := router.Group("/v1/tutor/lessons", auth, tutorGuard)
	gTutor.Get("/", a.handleTutorList)
	gTutor.Post("/", a.handleCreate)
	gTutor.Patch("/:id", a.handleUpdate)
	gTutor.Delete("/:id", a.handleDelete)
	gTutor.Get("/:id/content", a.handleTutorReadContent)
	gTutor.Get("/:id/resources", a.handleTutorReadResources)
	gTutor.Post("/:id/video", a.handleUpsertVideoContent)
	gTutor.Post("/:id/document", a.handleUpsertDocumentContent)
	gTutor.Post("/:id/resources", a.handleCreateResource)
	gTutor.Delete("/:id/resources/:resourceID", a.handleDeleteResource)

	// Student study endpoints
	gStudent := router.Group("/v1/lessons", auth)
	gStudent.Get("/:id/content", a.handleStudentReadContent)
	gStudent.Get("/:id/resources", a.handleStudentReadResources)
	gStudent.Post("/:id/complete", a.handleUpdateComplete)
}
