package notes

import (
	"errors"
	"fmt"
	"time"

	"coursehunt/api/internals/generic"
	"coursehunt/api/internals/utils"

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

	m.Cache.InvalidateNotes(c.Context())

	return utils.OK(c, "Note saved.", n)
}

func (m *NotesModule) ReadController(c *fiber.Ctx) error {
	lessonID := c.Query("lesson_id")
	if lessonID == "" {
		return utils.BadRequest(c, "Lesson ID query param required.", nil)
	}
	userID := utils.GetUserID(c)
	cacheKey := fmt.Sprintf("notes:read:u:%s:l:%s", userID, lessonID)

	var cached NoteResponse
	if hit, _ := m.Cache.Get(c.Context(), cacheKey, &cached); hit {
		return utils.OK(c, "Note fetched.", cached)
	}

	n, err := m.ReadRepository(userID, lessonID)
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

	_ = m.Cache.Set(c.Context(), cacheKey, n, 10*time.Minute)

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

	m.Cache.InvalidateNotes(c.Context())

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

	m.Cache.InvalidateNotes(c.Context())

	return utils.OK(c, "Note deleted.", generic.DeleteResponse{ID: id})
}
