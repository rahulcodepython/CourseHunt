package notes

import (
	"errors"
	"net/http"

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
		return utils.JSON(c, http.StatusBadRequest, false, "Lesson ID query param required.", nil, nil)
	}
	userID := utils.GetUserID(c)
	n, err := m.UpsertRepository(userID, lessonID, req.Content)
	if err != nil {
		switch {
		case errors.Is(err, ErrLessonNotFound):
			return utils.JSON(c, http.StatusNotFound, false, "Lesson not found.", nil, err.Error())
		case errors.Is(err, ErrNotEnrolled):
			return utils.JSON(c, http.StatusForbidden, false, "Access denied. Not enrolled in course.", nil, err.Error())
		default:
			return utils.JSON(c, http.StatusInternalServerError, false, "Failed to save note.", nil, nil)
		}
	}
	return utils.JSON(c, http.StatusOK, true, "Note saved.", n, nil)
}

func (m *NotesModule) ReadController(c *fiber.Ctx) error {
	lessonID := c.Query("lesson_id")
	if lessonID == "" {
		return utils.JSON(c, http.StatusBadRequest, false, "Lesson ID query param required.", nil, nil)
	}
	n, err := m.ReadRepository(utils.GetUserID(c), lessonID)
	if err != nil {
		switch {
		case errors.Is(err, ErrLessonNotFound):
			return utils.JSON(c, http.StatusNotFound, false, "Lesson not found.", nil, err.Error())
		case errors.Is(err, ErrNotEnrolled):
			return utils.JSON(c, http.StatusForbidden, false, "Access denied. Not enrolled in course.", nil, err.Error())
		case errors.Is(err, ErrNoteNotFound):
			return utils.JSON(c, http.StatusNotFound, false, "Note not found.", nil, err.Error())
		default:
			return utils.JSON(c, http.StatusInternalServerError, false, "Failed to fetch note.", nil, nil)
		}
	}
	return utils.JSON(c, http.StatusOK, true, "Note fetched.", n, nil)
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
			return utils.JSON(c, http.StatusNotFound, false, "Note not found.", nil, err.Error())
		case errors.Is(err, ErrAccessDenied):
			return utils.JSON(c, http.StatusForbidden, false, "Access denied. You do not own this note.", nil, err.Error())
		case errors.Is(err, ErrNotEnrolled):
			return utils.JSON(c, http.StatusForbidden, false, "Access denied. Not enrolled in course.", nil, err.Error())
		default:
			return utils.JSON(c, http.StatusInternalServerError, false, "Failed to update note.", nil, nil)
		}
	}
	return utils.JSON(c, http.StatusOK, true, "Note updated.", n, nil)
}

func (m *NotesModule) DeleteController(c *fiber.Ctx) error {
	id, err := m.DeleteRepository(c.Params("id"), utils.GetUserID(c))
	if err != nil {
		switch {
		case errors.Is(err, ErrNoteNotFound):
			return utils.JSON(c, http.StatusNotFound, false, "Note not found.", nil, err.Error())
		case errors.Is(err, ErrAccessDenied):
			return utils.JSON(c, http.StatusForbidden, false, "Access denied. You do not own this note.", nil, err.Error())
		case errors.Is(err, ErrNotEnrolled):
			return utils.JSON(c, http.StatusForbidden, false, "Access denied. Not enrolled in course.", nil, err.Error())
		default:
			return utils.JSON(c, http.StatusInternalServerError, false, "Failed to delete note.", nil, nil)
		}
	}
	return utils.JSON(c, http.StatusOK, true, "Note deleted.", map[string]string{"id": id}, nil)
}
