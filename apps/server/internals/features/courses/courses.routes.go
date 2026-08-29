package courses

import (
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (a *App) RegisterRoutes(router fiber.Router, auth fiber.Handler) {
	router.Get("/v1/courses", a.handlePublicList)
	router.Get("/v1/courses/course/:slug", a.handlePublicSingle)

	manage := middlewares.PermissionGuard(generic.PermTutorCoursesManage, generic.PermAdminCoursesInspect)
	manageOnly := middlewares.PermissionGuard(generic.PermTutorCoursesManage)

	g := router.Group("/v1/courses", auth)
	g.Get("/:id/study", a.handleStudy)
	g.Get("/enrolled", a.handleEnrolledList)
	g.Post("/:id/enroll", a.handleEnrollFree)
	g.Get("/manage", manage, a.handleManageList)
	g.Get("/:id", manage, a.handleGetByID)
	g.Post("/", manageOnly, a.handleCreate)
	g.Patch("/:id", manageOnly, a.handleUpdate)
	g.Delete("/:id", manageOnly, a.handleDelete)
}
