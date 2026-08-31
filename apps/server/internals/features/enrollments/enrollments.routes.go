package enrollments

import (
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (a *App) RegisterRoutes(router fiber.Router, auth fiber.Handler) {
	// Admin enrollments inspection and revoke/regain
	adminInspect := middlewares.PermissionGuard(generic.PermAdminEnrollmentsInspect)
	adminRevoke := middlewares.PermissionGuard(generic.PermAdminRevokeCourse)

	gAdmin := router.Group("/v1/admin/enrollments", auth)
	gAdmin.Get("/", adminInspect, a.handleAdminList)
	gAdmin.Post("/:userId/:courseId/revoke", adminRevoke, a.handleRevoke)
	gAdmin.Post("/:userId/:courseId/regain", adminRevoke, a.handleRegain)

	// Tutor enrollments management: strictly single permission PermTutorCoursesManage
	tutorGuard := middlewares.PermissionGuard(generic.PermTutorCoursesManage)
	gTutor := router.Group("/v1/tutor/enrollments", auth, tutorGuard)
	gTutor.Get("/", a.handleTutorList)
}
