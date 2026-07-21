package feedbacks

import (
	"coursehunt/api/internals/generic"
	"coursehunt/api/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (m *FeedbacksModule) Routes(v1, protected fiber.Router) {
	v1.Get("/feedbacks/pinned", m.ListPinnedController)

	protected.Post("/feedbacks", middlewares.PermissionGuard(generic.UserFeedbackCreate), m.CreateController)
	protected.Get("/feedbacks/inspect", middlewares.PermissionGuard(generic.AdminFeedbackInspect), m.InspectController)

	feedbacks := protected.Group("/feedbacks", middlewares.PermissionGuard(generic.TutorFeedbackManage))
	feedbacks.Get("", m.ListController)
	feedbacks.Delete("/:id", m.DeleteController)
	feedbacks.Patch("/:id", m.UpdateController)
}
