package routes

import (
	"coursehunt-backend/internals/handlers"
	"github.com/gofiber/fiber/v2"
)

func SetupDiscussionsRoutes(protected fiber.Router, h *handlers.DiscussionHandler) {
	discussions := protected.Group("/discussions")
	discussions.Get("/lesson/:lessonID", h.List)
	discussions.Get("/replies/:id", h.ListReplies)
	discussions.Post("/lesson/:lessonID", h.Create)
	discussions.Delete("/:id", h.Delete)
}
