package lessons

import (
	"coursehunt/api/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (m *LessonsModule) Routes(v1, protected fiber.Router) {
	studentLessonOperation := protected.Group("/lessons", middlewares.PermissionGuard("courses:study"))
	studentLessonOperation.Get("/:id/content", m.ReadContentController)
	studentLessonOperation.Post("/:id/complete", m.UpdateCompleteController)
	studentLessonOperation.Get("/:id/resources", m.ReadResourcesController)

	lessons := protected.Group("/lessons", middlewares.PermissionGuard("courses:manage"))
	lessons.Get("", m.ListController)
	lessons.Post("", m.CreateController)
	lessons.Patch("/:id", m.UpdateController)
	lessons.Delete("/:id", m.DeleteController)

	lessons.Post("/:id/video", m.UpsertVideoContentController)
	lessons.Post("/:id/document", m.UpsertDocumentContentController)

	lessons.Post("/:id/resources", m.CreateResourceController)
	lessons.Delete("/:id/resources/:resourceID", m.DeleteResourceController)
}
