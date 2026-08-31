package lessons

import (
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (a *App) RegisterRoutes(router fiber.Router, auth fiber.Handler) {
	manageOrInspect := middlewares.PermissionGuard(generic.PermTutorCoursesManage, generic.PermAdminCoursesInspect)
	manage := middlewares.PermissionGuard(generic.PermTutorCoursesManage)
	inspectScope := middlewares.ScopeGuard(generic.PermAdminCoursesInspect)

	g := router.Group("/v1/lessons", auth)
	g.Get("/", manageOrInspect, a.handleList)
	g.Post("/", manage, a.handleCreate)
	g.Patch("/:id", manage, a.handleUpdate)
	g.Delete("/:id", manage, a.handleDelete)
	g.Get("/:id/content", inspectScope, a.handleReadContent)
	g.Post("/:id/complete", a.handleUpdateComplete)
	g.Get("/:id/resources", inspectScope, a.handleReadResources)

	// Tutor-authoring reads: ownership-gated, not enrollment-gated
	g.Get("/:id/manage/content", manage, a.handleReadContentForTutor)
	g.Get("/:id/manage/resources", manage, a.handleReadResourcesForTutor)
	g.Post("/:id/video", manage, a.handleUpsertVideoContent)
	g.Post("/:id/document", manage, a.handleUpsertDocumentContent)
	g.Post("/:id/resources", manage, a.handleCreateResource)
	g.Delete("/:id/resources/:resourceID", manage, a.handleDeleteResource)
}
