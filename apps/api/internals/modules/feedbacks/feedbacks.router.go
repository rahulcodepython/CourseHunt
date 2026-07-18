package feedbacks

import (
	"coursehunt-backend/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (m *FeedbacksModule) Routes(v1, protected fiber.Router) {
	v1.Get("/feedbacks/pinned", m.ListPinnedController)

	protected.Post("/feedbacks", middlewares.PermissionGuard("feedback:create"), m.CreateController)
	protected.Get("/feedbacks/inspect", middlewares.PermissionGuard("feedback:inspect"), m.InspectController)

	feedbacks := protected.Group("/feedbacks", middlewares.PermissionGuard("feedback:manage"))
	feedbacks.Get("", m.ListController)
	feedbacks.Delete("/:id", m.DeleteController)
	feedbacks.Patch("/:id", m.UpdateController)
}
