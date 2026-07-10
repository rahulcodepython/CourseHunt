package feedbacks

import (
	"coursehunt-backend/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (m *FeedbacksModule) Routes(v1, protected fiber.Router) {
	v1.Get("/feedbacks", m.ListController)

	feedbacks := protected.Group("/feedbacks")
	feedbacks.Post("/course/:courseID", m.CreateController)
	feedbacks.Delete("/course/:courseID/:id", middlewares.PermissionGuard("feedback:delete"), m.DeleteController)
	feedbacks.Patch("/course/:courseID/:id/pin", middlewares.PermissionGuard("feedback:pin"), m.UpdateController)
}
