package chapters

import (
	"coursehunt/api/internals/generic"
	"coursehunt/api/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (m *ChaptersModule) Routes(v1, protected fiber.Router) {
	chapters := protected.Group("/chapters")
	chapters.Get("", middlewares.PermissionGuard(generic.TutorCoursesManage, generic.AdminCoursesInspect), m.ListController)
	chapters.Post("", middlewares.PermissionGuard(generic.TutorCoursesManage), m.CreateController)
	chapters.Patch("/:id", middlewares.PermissionGuard(generic.TutorCoursesManage), m.UpdateController)
	chapters.Delete("/:id", middlewares.PermissionGuard(generic.TutorCoursesManage), m.DeleteController)
}
