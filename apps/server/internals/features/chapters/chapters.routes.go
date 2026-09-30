package chapters

import (
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (a *App) RegisterRoutes(router fiber.Router, auth fiber.Handler) {
	// Admin chapter inspection: strictly single permission PermAdminCoursesInspect
	adminGuard := middlewares.PermissionGuard(generic.PermAdminCoursesInspect)
	gAdmin := router.Group("/v1/admin/chapters", auth, adminGuard)
	gAdmin.Get("/", a.handleAdminList)
	gAdmin.Get("/:id", middlewares.ValidateUUIDParams("id"), a.handleAdminGetByID)

	// Tutor chapter management: strictly single permission PermTutorCoursesManage
	tutorGuard := middlewares.PermissionGuard(generic.PermTutorCoursesManage)
	gTutor := router.Group("/v1/tutor/chapters", auth, tutorGuard)
	gTutor.Get("/", a.handleTutorList)
	gTutor.Get("/:id", middlewares.ValidateUUIDParams("id"), a.handleTutorGetByID)
	gTutor.Post("/", a.handleCreate)
	gTutor.Patch("/:id", middlewares.ValidateUUIDParams("id"), a.handleUpdate)
	gTutor.Delete("/:id", middlewares.ValidateUUIDParams("id"), a.handleDelete)
}
