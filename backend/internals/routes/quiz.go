package routes

import (
	"coursehunt-backend/internals/handlers"
	"coursehunt-backend/internals/middlewares"
	"github.com/gofiber/fiber/v2"
)

func SetupQuizRoutes(protected fiber.Router, h *handlers.QuizHandler) {
	quiz := protected.Group("/quiz")
	// Tutor actions
	quiz.Post("/lesson/:lessonID", middlewares.PermissionGuard("courses:update"), h.CreateMetadata)
	quiz.Post("/:quizID/questions", middlewares.PermissionGuard("courses:update"), h.AddQuestion)
	quiz.Delete("/questions/:id", middlewares.PermissionGuard("courses:update"), h.DeleteQuestion)

	// User actions
	quiz.Post("/lesson/:lessonID/start", h.StartAttempt)
	quiz.Post("/lesson/:lessonID/next", h.NextQuestion)
	quiz.Post("/lesson/:lessonID/submit", h.Submit)
}
