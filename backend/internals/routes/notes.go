package routes

import (
	"coursehunt-backend/internals/handlers"
	"github.com/gofiber/fiber/v2"
)

func SetupNotesRoutes(protected fiber.Router, h *handlers.NoteHandler) {
	notes := protected.Group("/notes")
	notes.Get("/lesson/:lessonID", h.Get)
	notes.Post("/lesson/:lessonID", h.Upsert)
}
