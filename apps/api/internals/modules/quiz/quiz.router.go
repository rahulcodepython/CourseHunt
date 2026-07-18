package quiz

import (
	"coursehunt-backend/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (m *QuizModule) Routes(v1, protected fiber.Router) {
	quiz := protected.Group("/quiz")

	// Tutor actions
	quiz.Post("/metadata", middlewares.PermissionGuard("quiz:manage"), m.CreateMetadataController)
	quiz.Post("/questions", middlewares.PermissionGuard("quiz:manage"), m.CreateQuestionController)
	quiz.Delete("/questions/:id", middlewares.PermissionGuard("quiz:manage"), m.DeleteQuestionController)

	// User actions
	quiz.Post("/question", middlewares.PermissionGuard("quiz:access"), m.GetQuestionController)
	quiz.Post("/submit", middlewares.PermissionGuard("quiz:access"), m.CreateSubmitController)
}
