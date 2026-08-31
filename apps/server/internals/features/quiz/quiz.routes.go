package quiz

import (
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (a *App) RegisterRoutes(router fiber.Router, auth fiber.Handler) {
	// Admin quiz inspection: strictly single permission PermAdminCoursesInspect
	adminGuard := middlewares.PermissionGuard(generic.PermAdminCoursesInspect)
	gAdmin := router.Group("/v1/admin/quiz", auth, adminGuard)
	gAdmin.Get("/metadata", a.handleAdminReadMetadata)
	gAdmin.Get("/questions", a.handleAdminListQuestions)

	// Tutor quiz management: strictly single permission PermTutorQuizManage
	tutorGuard := middlewares.PermissionGuard(generic.PermTutorQuizManage)
	gTutor := router.Group("/v1/tutor/quiz", auth, tutorGuard)
	gTutor.Post("/metadata", a.handleCreateMetadata)
	gTutor.Get("/metadata", a.handleTutorReadMetadata)
	gTutor.Post("/questions", a.handleCreateQuestion)
	gTutor.Get("/questions", a.handleTutorListQuestions)
	gTutor.Patch("/questions/:id", a.handleUpdateQuestion)
	gTutor.Delete("/questions/:id", a.handleDeleteQuestion)

	// Student quiz taking
	gStudent := router.Group("/v1/quiz", auth)
	gStudent.Post("/question", a.handleGetQuestion)
	gStudent.Post("/submit", a.handleCreateSubmit)
	gStudent.Get("/attempts", a.handleListAttempts)
	gStudent.Get("/attempts/:id", a.handleGetAttemptDetail)
}
