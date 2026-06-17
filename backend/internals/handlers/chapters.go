package handlers

import (
	"net/http"

	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/services"
	"coursehunt-backend/internals/utils"
	"github.com/gofiber/fiber/v2"
)

type ChapterHandler struct{ Svc *services.ChapterService }
func NewChapterHandler() *ChapterHandler { return &ChapterHandler{Svc: services.NewChapterService()} }

func (h *ChapterHandler) List(c *fiber.Ctx) error {
	chapters, err := h.Svc.List(c.Params("courseID"))
	if err != nil { return utils.JSON(c, http.StatusInternalServerError, false, "failed to fetch chapters", nil, err.Error()) }
	return utils.JSON(c, http.StatusOK, true, "chapters fetched successfully", chapters, nil)
}
func (h *ChapterHandler) Create(c *fiber.Ctx) error {
	var req models.CreateChapterRequest
	if ok, err := utils.Validate(c, &req); !ok { return err }
	ch, err := h.Svc.Create(c.Params("courseID"), req)
	if err != nil { return utils.JSON(c, http.StatusInternalServerError, false, "failed to create chapter", nil, err.Error()) }
	return utils.JSON(c, http.StatusCreated, true, "chapter created successfully", ch, nil)
}
func (h *ChapterHandler) Update(c *fiber.Ctx) error {
	var req models.UpdateChapterRequest
	if ok, err := utils.Validate(c, &req); !ok { return err }
	ch, err := h.Svc.Update(c.Params("id"), req)
	if err != nil { return utils.JSON(c, http.StatusInternalServerError, false, "failed to update chapter", nil, err.Error()) }
	return utils.JSON(c, http.StatusOK, true, "chapter updated successfully", ch, nil)
}
func (h *ChapterHandler) Delete(c *fiber.Ctx) error {
	if err := h.Svc.Delete(c.Params("id")); err != nil { return utils.JSON(c, http.StatusInternalServerError, false, "failed to delete chapter", nil, err.Error()) }
	return utils.JSON(c, http.StatusOK, true, "chapter deleted successfully", nil, nil)
}
