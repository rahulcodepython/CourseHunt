package notes

import (
	"github.com/gofiber/fiber/v2"
)

func (m *NotesModule) Routes(protected fiber.Router) {
	notes := protected.Group("/notes")
	notes.Get("/lesson/:lessonID", m.ReadController)
	notes.Post("/course/:courseID/lesson/:lessonID", m.UpsertController)
	notes.Patch("/:id", m.UpdateController)
	notes.Delete("/:id", m.DeleteController)
}
