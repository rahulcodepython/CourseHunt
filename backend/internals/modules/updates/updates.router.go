package updates

import (
	"coursehunt-backend/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (m *UpdatesModule) Routes(v1, protected fiber.Router) {
	protected.Get("/updates/feed", m.FeedController) // user feed (wait, feed was on /updates/feed but old code had it as protected.Group then Get("/feed", h.Feed))

	// Actually keeping the old route structure
	updatesAdmin := protected.Group("/updates")

	// Admin CRUD
	updatesAdmin.Get("", middlewares.PermissionGuard("updates:read"), m.ListController)
	updatesAdmin.Post("", middlewares.PermissionGuard("updates:create"), m.CreateController)
	updatesAdmin.Patch("/:id", middlewares.PermissionGuard("updates:update"), m.UpdateController)
	updatesAdmin.Delete("/:id", middlewares.PermissionGuard("updates:delete"), m.DeleteController)
}
