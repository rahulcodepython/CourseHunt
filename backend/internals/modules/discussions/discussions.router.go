package discussions

import (
	"github.com/gofiber/fiber/v2"
)

func (m *DiscussionsModule) Routes(protected fiber.Router) {
	discussions := protected.Group("/discussions")
	discussions.Get("/lesson/:lessonID", m.ListController)
	discussions.Get("/replies/:id", m.ListRepliesController)
	discussions.Post("/course/:courseID/lesson/:lessonID", m.CreateController)
	discussions.Patch("/course/:courseID/:id", m.UpdateController)
	discussions.Delete("/:id", m.DeleteController)
}
