package courses

import (
	"coursehunt-backend/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (m *CoursesModule) Routes(v1, protected fiber.Router) {
	// Public
	v1.Get("/courses", m.PublicListController)
	v1.Get("/courses/:slug", m.PublicSingleController)

	// Protected
	courses := protected.Group("/courses")
	courses.Get("/:id/study", middlewares.PermissionGuard("courses:study"), m.StudyController)
	courses.Get("/enrolled", middlewares.PermissionGuard("courses:study"), m.EnrolledListController)

	courses.Get("/inspect", middlewares.PermissionGuard("courses:inspect"), m.InspectController)

	courseManage := protected.Group("/courses", middlewares.PermissionGuard("courses:manage"))
	courseManage.Get("", m.ListController)
	courseManage.Post("", m.CreateController)
	courseManage.Patch("/:id", m.UpdateController)
	courseManage.Delete("/:id", m.DeleteController)
}
