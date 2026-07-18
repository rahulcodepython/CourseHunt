package notes

import (
	"coursehunt-backend/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (m *NotesModule) Routes(v1, protected fiber.Router) {
	notes := protected.Group("/notes", middlewares.PermissionGuard("notes:manage"))
	notes.Get("", m.ReadController)
	notes.Post("", m.UpsertController)
	notes.Patch("/:id", m.UpdateController)
	notes.Delete("/:id", m.DeleteController)
}
