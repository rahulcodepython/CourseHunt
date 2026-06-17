package routes

import (
	"coursehunt-backend/internals/handlers"
	"coursehunt-backend/internals/middlewares"
	"github.com/gofiber/fiber/v2"
)

func SetupFeedbacksRoutes(v1, protected fiber.Router, h *handlers.FeedbackHandler) {
	v1.Get("/feedbacks", h.List)

	feedbacks := protected.Group("/feedbacks")
	feedbacks.Post("/course/:courseID", h.Create)
	feedbacks.Delete("/:id", middlewares.PermissionGuard("feedback:delete"), h.Delete)
	feedbacks.Patch("/:id/pin", middlewares.PermissionGuard("feedback:pin"), h.Pin)
}
