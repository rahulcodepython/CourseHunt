package updates

import (
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (a *App) RegisterRoutes(router fiber.Router, auth fiber.Handler) {
	// Admin Updates Management: strictly single permission PermAdminUpdatesManage
	adminGuard := middlewares.PermissionGuard(generic.PermAdminUpdatesManage)
	gAdmin := router.Group("/v1/admin/updates", auth, adminGuard)
	gAdmin.Get("/", a.handleAdminList)
	gAdmin.Post("/", a.handleAdminCreate)
	gAdmin.Patch("/:id", a.handleAdminUpdate)
	gAdmin.Delete("/:id", a.handleAdminDelete)

	// Tutor Updates Management: strictly single permission PermTutorUpdatesManage
	tutorGuard := middlewares.PermissionGuard(generic.PermTutorUpdatesManage)
	gTutor := router.Group("/v1/tutor/updates", auth, tutorGuard)
	gTutor.Get("/", a.handleTutorList)
	gTutor.Post("/", a.handleTutorCreate)
	gTutor.Patch("/:id", a.handleTutorUpdate)
	gTutor.Delete("/:id", a.handleTutorDelete)

	// Student Updates Feed
	router.Get("/v1/updates/feed", auth, a.handleFeed)
}
