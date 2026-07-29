package updates

import (
	"coursehunt/api/internals/generic"
	"coursehunt/api/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (m *UpdatesModule) Routes(v1, protected fiber.Router) {
	protected.Get("/updates/feed", middlewares.PermissionGuard(generic.EnrolledUpdatesFeed), m.FeedController) // user feed (wait, feed was on /updates/feed but old code had it as protected.Group then Get("/feed", h.Feed))

	// Actually keeping the old route structure
	updatesAdmin := protected.Group("/updates", middlewares.PermissionGuard(generic.TutorUpdatesManage))

	// Admin CRUD
	updatesAdmin.Get("", m.ListController)
	updatesAdmin.Post("", m.CreateController)
	updatesAdmin.Patch("/:id", m.UpdateController)
	updatesAdmin.Delete("/:id", m.DeleteController)
}
