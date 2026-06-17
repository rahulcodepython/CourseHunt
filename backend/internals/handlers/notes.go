package handlers

import (
	"net/http"

	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/services"
	"coursehunt-backend/internals/utils"
	"github.com/gofiber/fiber/v2"
)

type NoteHandler struct{ Svc *services.NoteService }

func NewNoteHandler() *NoteHandler { return &NoteHandler{Svc: services.NewNoteService()} }

func (h *NoteHandler) Upsert(c *fiber.Ctx) error {
	var req models.UpsertNoteRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	courseID := c.Query("course_id")
	if courseID == "" {
		return utils.JSON(c, http.StatusBadRequest, false, "course_id query param required", nil, nil)
	}
	n, err := h.Svc.Upsert(getUserID(c), c.Params("lessonID"), courseID, req.Content)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to save note", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "note saved", n, nil)
}

func (h *NoteHandler) Get(c *fiber.Ctx) error {
	n, err := h.Svc.Get(getUserID(c), c.Params("lessonID"))
	if err != nil {
		return utils.JSON(c, http.StatusNotFound, false, "note not found", nil, nil)
	}
	return utils.JSON(c, http.StatusOK, true, "note fetched", n, nil)
}
