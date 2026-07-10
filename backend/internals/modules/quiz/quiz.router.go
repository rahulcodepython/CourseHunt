package quiz

import (
	"coursehunt-backend/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (m *QuizModule) Routes(protected fiber.Router) {
	quiz := protected.Group("/quiz")
	// Tutor actions
	quiz.Post("/lesson/:lessonID", middlewares.PermissionGuard("courses:update"), m.CreateMetadataController)
	quiz.Post("/:quizID/questions", middlewares.PermissionGuard("courses:update"), m.CreateQuestionController)
	quiz.Delete("/questions/:id", middlewares.PermissionGuard("courses:update"), m.DeleteQuestionController)

	// User actions
	quiz.Post("/lesson/:lessonID/quiz/:quizID/question", m.GetQuestionController)
	quiz.Post("/lesson/:lessonID/quiz/:quizID/submit", m.CreateSubmitController)
}
