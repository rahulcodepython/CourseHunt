package lessons

import (
	"coursehunt-backend/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (m *LessonsModule) Routes(protected fiber.Router) {
	lessons := protected.Group("/lessons")
	lessons.Get("/chapter/:chapterID", m.ListController)
	lessons.Post("/chapter/:chapterID", middlewares.PermissionGuard("courses:update"), m.CreateController)
	lessons.Patch("/:id", middlewares.PermissionGuard("courses:update"), m.UpdateController)
	lessons.Delete("/:id", middlewares.PermissionGuard("courses:update"), m.DeleteController)

	lessons.Post("/:id/video", middlewares.PermissionGuard("courses:update"), m.UpsertVideoContentController)
	lessons.Post("/:id/document", middlewares.PermissionGuard("courses:update"), m.UpsertDocumentContentController)

	lessons.Get("/:id/content", m.ReadContentController)
	lessons.Post("/:id/complete", m.UpdateCompleteController)

	lessons.Post("/:id/resources", middlewares.PermissionGuard("courses:update"), m.CreateResourceController)
	lessons.Delete("/resources/:resourceID", middlewares.PermissionGuard("courses:update"), m.DeleteResourceController)

	lessons.Get("/:id/signed-url", middlewares.PermissionGuard("media:upload"), m.GetSignedURLController)
}
