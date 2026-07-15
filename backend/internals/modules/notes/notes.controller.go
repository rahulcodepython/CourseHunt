package notes

import (
	"errors"

	"coursehunt-backend/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (m *NotesModule) UpsertController(c *fiber.Ctx) error {
	var req UpsertNoteRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	lessonID := c.Query("lesson_id")
	if lessonID == "" {
		return utils.BadRequest(c, "Lesson ID query param required.", nil)
	}
	userID := utils.GetUserID(c)
	n, err := m.UpsertRepository(userID, lessonID, req.Content)
	if err != nil {
		switch {
		case errors.Is(err, ErrLessonNotFound):
			return utils.NotFound(c, "Lesson not found.", err)
		case errors.Is(err, ErrNotEnrolled):
			return utils.Forbidden(c, "Access denied. Not enrolled in course.", err)
		default:
			return utils.InternalError(c, "Failed to save note.", err)
		}
	}
	return utils.OK(c, "Note saved.", n)
}

func (m *NotesModule) ReadController(c *fiber.Ctx) error {
	lessonID := c.Query("lesson_id")
	if lessonID == "" {
		return utils.BadRequest(c, "Lesson ID query param required.", nil)
	}
	n, err := m.ReadRepository(utils.GetUserID(c), lessonID)
	if err != nil {
		switch {
		case errors.Is(err, ErrLessonNotFound):
			return utils.NotFound(c, "Lesson not found.", err)
		case errors.Is(err, ErrNotEnrolled):
			return utils.Forbidden(c, "Access denied. Not enrolled in course.", err)
		case errors.Is(err, ErrNoteNotFound):
			return utils.NotFound(c, "Note not found.", err)
		default:
			return utils.InternalError(c, "Failed to fetch note.", err)
		}
	}
	return utils.OK(c, "Note fetched.", n)
}

func (m *NotesModule) UpdateController(c *fiber.Ctx) error {
	var req UpsertNoteRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	n, err := m.UpdateRepository(c.Params("id"), utils.GetUserID(c), req.Content)
	if err != nil {
		switch {
		case errors.Is(err, ErrNoteNotFound):
			return utils.NotFound(c, "Note not found.", err)
		case errors.Is(err, ErrAccessDenied):
			return utils.Forbidden(c, "Access denied. You do not own this note.", err)
		case errors.Is(err, ErrNotEnrolled):
			return utils.Forbidden(c, "Access denied. Not enrolled in course.", err)
		default:
			return utils.InternalError(c, "Failed to update note.", err)
		}
	}
	return utils.OK(c, "Note updated.", n)
}

func (m *NotesModule) DeleteController(c *fiber.Ctx) error {
	id, err := m.DeleteRepository(c.Params("id"), utils.GetUserID(c))
	if err != nil {
		switch {
		case errors.Is(err, ErrNoteNotFound):
			return utils.NotFound(c, "Note not found.", err)
		case errors.Is(err, ErrAccessDenied):
			return utils.Forbidden(c, "Access denied. You do not own this note.", err)
		case errors.Is(err, ErrNotEnrolled):
			return utils.Forbidden(c, "Access denied. Not enrolled in course.", err)
		default:
			return utils.InternalError(c, "Failed to delete note.", err)
		}
	}
	return utils.OK(c, "Note deleted.", map[string]string{"id": id})
}
