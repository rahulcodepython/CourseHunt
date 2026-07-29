package quiz

import (
	"coursehunt/api/internals/generic"
	"coursehunt/api/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (m *QuizModule) Routes(v1, protected fiber.Router) {
	quiz := protected.Group("/quiz")

	// Tutor actions
	quiz.Post("/metadata", middlewares.PermissionGuard(generic.TutorQuizManage), m.CreateMetadataController)
	quiz.Post("/questions", middlewares.PermissionGuard(generic.TutorQuizManage), m.CreateQuestionController)
	quiz.Delete("/questions/:id", middlewares.PermissionGuard(generic.TutorQuizManage), m.DeleteQuestionController)

	// User actions
	quiz.Post("/question", middlewares.PermissionGuard(generic.EnrolledQuizAccess), m.GetQuestionController)
	quiz.Post("/submit", middlewares.PermissionGuard(generic.EnrolledQuizAccess), m.CreateSubmitController)
}
