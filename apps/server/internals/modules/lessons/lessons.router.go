package lessons

import (
	"coursehunt/api/internals/generic"
	"coursehunt/api/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (m *LessonsModule) Routes(v1, protected fiber.Router) {
	lessons := protected.Group("/lessons")

	lessons.Get("", middlewares.PermissionGuard(generic.TutorCoursesManage, generic.AdminCoursesInspect), m.ListController)
	lessons.Post("", middlewares.PermissionGuard(generic.TutorCoursesManage), m.CreateController)
	lessons.Patch("/:id", middlewares.PermissionGuard(generic.TutorCoursesManage), m.UpdateController)
	lessons.Delete("/:id", middlewares.PermissionGuard(generic.TutorCoursesManage), m.DeleteController)

	lessons.Get("/:id/content", middlewares.PermissionGuard(generic.EnrolledCoursesStudy, generic.AdminCoursesInspect), m.ReadContentController)
	lessons.Post("/:id/complete", middlewares.PermissionGuard(generic.EnrolledCoursesStudy), m.UpdateCompleteController)
	lessons.Get("/:id/resources", middlewares.PermissionGuard(generic.EnrolledCoursesStudy, generic.AdminCoursesInspect), m.ReadResourcesController)

	lessons.Post("/:id/video", middlewares.PermissionGuard(generic.TutorCoursesManage), m.UpsertVideoContentController)
	lessons.Post("/:id/document", middlewares.PermissionGuard(generic.TutorCoursesManage), m.UpsertDocumentContentController)

	lessons.Post("/:id/resources", middlewares.PermissionGuard(generic.TutorCoursesManage), m.CreateResourceController)
	lessons.Delete("/:id/resources/:resourceID", middlewares.PermissionGuard(generic.TutorCoursesManage), m.DeleteResourceController)
}
