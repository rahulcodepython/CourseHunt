package quiz

import (
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (a *App) RegisterRoutes(router fiber.Router, auth fiber.Handler) {
	manage := middlewares.PermissionGuard(generic.PermTutorQuizManage)
	manageOrInspect := middlewares.PermissionGuard(generic.PermTutorQuizManage, generic.PermAdminCoursesInspect)

	g := router.Group("/v1/quiz", auth)
	g.Post("/metadata", manage, a.handleCreateMetadata)
	g.Get("/metadata", manageOrInspect, a.handleReadMetadata)
	g.Post("/questions", manage, a.handleCreateQuestion)
	g.Get("/questions", manageOrInspect, a.handleListQuestions)
	g.Patch("/questions/:id", manage, a.handleUpdateQuestion)
	g.Delete("/questions/:id", manage, a.handleDeleteQuestion)
	g.Post("/question", a.handleGetQuestion)
	g.Post("/submit", a.handleCreateSubmit)
	g.Get("/attempts", a.handleListAttempts)
	g.Get("/attempts/:id", a.handleGetAttemptDetail)
}
