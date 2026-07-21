package feedbacks

import (
	"coursehunt/api/internals/generic"
	"coursehunt/api/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (m *FeedbacksModule) Routes(v1, protected fiber.Router) {
	v1.Get("/feedbacks/pinned", m.ListPinnedController)

	protected.Post("/feedbacks", middlewares.PermissionGuard(generic.UserFeedbackCreate), m.CreateController)
	protected.Get("/feedbacks", middlewares.PermissionGuard(generic.AdminFeedbackInspect, generic.TutorFeedbackManage), m.ListController)
	protected.Patch("/feedbacks/:id", middlewares.PermissionGuard(generic.AdminFeedbackInspect), m.UpdateController)
	protected.Delete("/feedbacks/:id", middlewares.PermissionGuard(generic.AdminFeedbackInspect, generic.TutorFeedbackManage), m.DeleteController)
}
