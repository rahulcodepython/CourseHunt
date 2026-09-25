package assignments

import (
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (a *App) RegisterRoutes(router fiber.Router, auth fiber.Handler) {
	// Tutor assignments: strictly single permission PermTutorCoursesManage
	tutorGuard := middlewares.PermissionGuard(generic.PermTutorCoursesManage)
	gTutor := router.Group("/v1/tutor/assignments", auth, tutorGuard)
	gTutor.Post("/lesson/:id", middlewares.ValidateUUIDParams("id"), a.handleCreateAssignment)
	gTutor.Get("/:id/submissions", middlewares.ValidateUUIDParams("id"), a.handleListSubmissions)
	gTutor.Post("/submissions/:id/grade", middlewares.ValidateUUIDParams("id"), a.handleGradeSubmission)

	// Student assignments
	gStudent := router.Group("/v1/assignments", auth)
	gStudent.Get("/lesson/:id", middlewares.ValidateUUIDParams("id"), a.handleGetAssignment)
	gStudent.Post("/:id/submit", middlewares.ValidateUUIDParams("id"), a.handleSubmitAssignment)
	gStudent.Get("/:id/submission", middlewares.ValidateUUIDParams("id"), a.handleGetSubmission)
}
