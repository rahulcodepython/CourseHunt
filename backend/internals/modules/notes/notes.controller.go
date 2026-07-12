package notes

import (
	"errors"
	"net/http"

	"coursehunt-backend/internals/utils"

	"github.com/gofiber/fiber/v2"
)

// @Summary UpsertController
// @Description UpsertController for Notes
// @Tags Notes
// @Accept json
// @Produce json
// @Param lesson_id query string true "lesson_id"
// @Param body body notes.UpsertNoteRequest true "Request Body"
// @Success 200 {object} utils.SwaggerResponse[NoteResponse]
// @Router /api/v1/notes [post]
func (m *NotesModule) UpsertController(ctx *fiber.Ctx) error {
	var req UpsertNoteRequest
	if ok, err := utils.Validate(ctx, &req); !ok {
		return err
	}
	lessonID := ctx.Query("lesson_id")
	if lessonID == "" {
		return utils.JSON(ctx, http.StatusBadRequest, false, "lesson_id query param required", nil, nil)
	}
	userID := utils.GetUserID(ctx)
	n, err := m.UpsertRepository(userID, lessonID, req.Content)
	if err != nil {
		switch {
		case errors.Is(err, ErrLessonNotFound):
			return utils.JSON(ctx, http.StatusNotFound, false, "lesson not found", nil, nil)
		case errors.Is(err, ErrNotEnrolled):
			return utils.JSON(ctx, http.StatusForbidden, false, "access denied: not enrolled in course", nil, nil)
		default:
			return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to save note", nil, err.Error())
		}
	}
	return utils.JSON(ctx, http.StatusOK, true, "note saved", n, nil)
}

// @Summary ReadController
// @Description ReadController for Notes
// @Tags Notes
// @Accept json
// @Produce json
// @Param lesson_id query string true "lesson_id"
// @Success 200 {object} utils.SwaggerResponse[UserNote]
// @Router /api/v1/notes [get]
func (m *NotesModule) ReadController(ctx *fiber.Ctx) error {
	lessonID := ctx.Query("lesson_id")
	if lessonID == "" {
		return utils.JSON(ctx, http.StatusBadRequest, false, "lesson_id query param required", nil, nil)
	}
	n, err := m.ReadRepository(utils.GetUserID(ctx), lessonID)
	if err != nil {
		switch {
		case errors.Is(err, ErrLessonNotFound):
			return utils.JSON(ctx, http.StatusNotFound, false, "lesson not found", nil, nil)
		case errors.Is(err, ErrNotEnrolled):
			return utils.JSON(ctx, http.StatusForbidden, false, "access denied: not enrolled in course", nil, nil)
		case errors.Is(err, ErrNoteNotFound):
			return utils.JSON(ctx, http.StatusNotFound, false, "note not found", nil, nil)
		default:
			return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to fetch note", nil, err.Error())
		}
	}
	return utils.JSON(ctx, http.StatusOK, true, "note fetched", n, nil)
}

// @Summary UpdateController
// @Description UpdateController for Notes
// @Tags Notes
// @Accept json
// @Produce json
// @Param id path string true "id"
// @Param body body notes.UpsertNoteRequest true "Request Body"
// @Success 200 {object} utils.SwaggerResponse[NoteResponse]
// @Router /api/v1/notes/{id} [patch]
func (m *NotesModule) UpdateController(ctx *fiber.Ctx) error {
	var req UpsertNoteRequest
	if ok, err := utils.Validate(ctx, &req); !ok {
		return err
	}
	n, err := m.UpdateRepository(ctx.Params("id"), utils.GetUserID(ctx), req.Content)
	if err != nil {
		switch {
		case errors.Is(err, ErrNoteNotFound):
			return utils.JSON(ctx, http.StatusNotFound, false, "note not found", nil, nil)
		case errors.Is(err, ErrAccessDenied):
			return utils.JSON(ctx, http.StatusForbidden, false, "access denied: you do not own this note", nil, nil)
		case errors.Is(err, ErrNotEnrolled):
			return utils.JSON(ctx, http.StatusForbidden, false, "access denied: not enrolled in course", nil, nil)
		default:
			return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to update note", nil, err.Error())
		}
	}
	return utils.JSON(ctx, http.StatusOK, true, "note updated", n, nil)
}

// @Summary DeleteController
// @Description DeleteController for Notes
// @Tags Notes
// @Accept json
// @Produce json
// @Param id path string true "id"
// @Success 200 {object} utils.SwaggerResponse[utils.DeleteResponse]
// @Router /api/v1/notes/{id} [delete]
func (m *NotesModule) DeleteController(ctx *fiber.Ctx) error {
	id, err := m.DeleteRepository(ctx.Params("id"), utils.GetUserID(ctx))
	if err != nil {
		switch {
		case errors.Is(err, ErrNoteNotFound):
			return utils.JSON(ctx, http.StatusNotFound, false, "note not found", nil, nil)
		case errors.Is(err, ErrAccessDenied):
			return utils.JSON(ctx, http.StatusForbidden, false, "access denied: you do not own this note", nil, nil)
		case errors.Is(err, ErrNotEnrolled):
			return utils.JSON(ctx, http.StatusForbidden, false, "access denied: not enrolled in course", nil, nil)
		default:
			return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to delete note", nil, err.Error())
		}
	}
	return utils.JSON(ctx, http.StatusOK, true, "note deleted", map[string]string{"id": id}, nil)
}
