package quiz

import (
	"coursehunt-backend/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (m *QuizModule) Routes(protected fiber.Router) {
	quiz := protected.Group("/quiz")
	// Tutor actions
	quiz.Post("/course/:courseID/lesson/:lessonID", middlewares.PermissionGuard("courses:update"), m.CreateMetadataController)
	quiz.Post("/course/:courseID/:quizID/questions", middlewares.PermissionGuard("courses:update"), m.CreateQuestionController)
	quiz.Delete("/course/:courseID/questions/:id", middlewares.PermissionGuard("courses:update"), m.DeleteQuestionController)

	// User actions
	quiz.Post("/course/:courseID/lesson/:lessonID/quiz/:quizID/question", m.GetQuestionController)
	quiz.Post("/course/:courseID/lesson/:lessonID/quiz/:quizID/submit", m.CreateSubmitController)
}
