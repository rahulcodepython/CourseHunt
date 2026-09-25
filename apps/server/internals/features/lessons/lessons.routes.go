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
	gAdmin.Get("/:id/content", middlewares.ValidateUUIDParams("id"), a.handleAdminReadContent)
	gAdmin.Get("/:id/resources", middlewares.ValidateUUIDParams("id"), a.handleAdminReadResources)

	// Tutor lessons management: strictly single permission PermTutorCoursesManage
	tutorGuard := middlewares.PermissionGuard(generic.PermTutorCoursesManage)
	gTutor := router.Group("/v1/tutor/lessons", auth, tutorGuard)
	gTutor.Get("/", a.handleTutorList)
	gTutor.Post("/", a.handleCreate)
	gTutor.Patch("/:id", middlewares.ValidateUUIDParams("id"), a.handleUpdate)
	gTutor.Delete("/:id", middlewares.ValidateUUIDParams("id"), a.handleDelete)
	gTutor.Get("/:id/content", middlewares.ValidateUUIDParams("id"), a.handleTutorReadContent)
	gTutor.Get("/:id/resources", middlewares.ValidateUUIDParams("id"), a.handleTutorReadResources)
	gTutor.Post("/:id/video", middlewares.ValidateUUIDParams("id"), a.handleUpsertVideoContent)
	gTutor.Post("/:id/document", middlewares.ValidateUUIDParams("id"), a.handleUpsertDocumentContent)
	gTutor.Post("/:id/resources", middlewares.ValidateUUIDParams("id"), a.handleCreateResource)
	gTutor.Delete("/:id/resources/:resourceID", middlewares.ValidateUUIDParams("id", "resourceID"), a.handleDeleteResource)

	// Student study endpoints
	gStudent := router.Group("/v1/lessons", auth)
	gStudent.Get("/:id/content", middlewares.ValidateUUIDParams("id"), a.handleStudentReadContent)
	gStudent.Get("/:id/resources", middlewares.ValidateUUIDParams("id"), a.handleStudentReadResources)
	gStudent.Post("/:id/complete", middlewares.ValidateUUIDParams("id"), a.handleUpdateComplete)
}
