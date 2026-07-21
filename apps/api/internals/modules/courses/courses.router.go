package courses

import (
	"coursehunt/api/internals/generic"
	"coursehunt/api/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (m *CoursesModule) Routes(v1, protected fiber.Router) {
	// Public
	v1.Get("/courses", m.PublicListController)
	v1.Get("/courses/:slug", m.PublicSingleController)

	// Protected
	courses := protected.Group("/courses")
	courses.Get("/:id/study", middlewares.PermissionGuard(generic.EnrolledCoursesStudy), m.StudyController)
	courses.Get("/enrolled", middlewares.PermissionGuard(generic.EnrolledCoursesStudy), m.EnrolledListController)

	courses.Get("/manage", middlewares.PermissionGuard(generic.TutorCoursesManage, generic.AdminCoursesInspect), m.ManageListController)

	courses.Post("", middlewares.PermissionGuard(generic.TutorCoursesManage), m.CreateController)
	courses.Patch("/:id", middlewares.PermissionGuard(generic.TutorCoursesManage), m.UpdateController)
	courses.Delete("/:id", middlewares.PermissionGuard(generic.TutorCoursesManage), m.DeleteController)
}
