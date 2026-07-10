package notes

import (
	"net/http"

	"coursehunt-backend/internals/utils"

	"github.com/gofiber/fiber/v2"
)

// @Summary UpsertController
// @Description UpsertController for Notes
// @Tags Notes
// @Accept json
// @Produce json
// @Param lessonID path string true "lessonID"
// @Param body body notes.UpsertNoteRequest true "Request Body"
// @Success 200 {object} utils.SwaggerResponse[NoteResponse]
// @Router /api/v1/notes/lesson/{lessonID} [post]
func (m *NotesModule) UpsertController(ctx *fiber.Ctx) error {
	var req UpsertNoteRequest
	if ok, err := utils.Validate(ctx, &req); !ok {
		return err
	}
	courseID := ctx.Query("course_id")
	if courseID == "" {
		return utils.JSON(ctx, http.StatusBadRequest, false, "course_id query param required", nil, nil)
	}
	n, err := m.UpsertService(utils.GetUserID(ctx), ctx.Params("lessonID"), courseID, req.Content)
	if err != nil {
		return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to save note", nil, err.Error())
	}
	return utils.JSON(ctx, http.StatusOK, true, "note saved", n, nil)
}

// @Summary ReadController
// @Description ReadController for Notes
// @Tags Notes
// @Accept json
// @Produce json
// @Param lessonID path string true "lessonID"
// @Success 200 {object} utils.SwaggerResponse[UserNote]
// @Router /api/v1/notes/lesson/{lessonID} [get]
func (m *NotesModule) ReadController(ctx *fiber.Ctx) error {
	n, err := m.ReadService(utils.GetUserID(ctx), ctx.Params("lessonID"))
	if err != nil {
		return utils.JSON(ctx, http.StatusNotFound, false, "note not found", nil, nil)
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
	n, err := m.UpdateService(ctx.Params("id"), utils.GetUserID(ctx), req.Content)
	if err != nil {
		return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to update note", nil, err.Error())
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
	id, err := m.DeleteService(ctx.Params("id"), utils.GetUserID(ctx))
	if err != nil {
		return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to delete note", nil, err.Error())
	}
	return utils.JSON(ctx, http.StatusOK, true, "note deleted", map[string]string{"id": id}, nil)
}
