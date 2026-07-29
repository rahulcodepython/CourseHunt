package notes

import (
	"coursehunt/api/internals/generic"
	"coursehunt/api/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (m *NotesModule) Routes(v1, protected fiber.Router) {
	notes := protected.Group("/notes", middlewares.PermissionGuard(generic.UserNotesManage))
	notes.Get("", m.ReadController)
	notes.Post("", m.UpsertController)
	notes.Patch("/:id", m.UpdateController)
	notes.Delete("/:id", m.DeleteController)
}
