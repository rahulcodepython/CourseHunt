package handlers

import (
	"net/http"

	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/services"
	"coursehunt-backend/internals/utils"
	"github.com/gofiber/fiber/v2"
)

type LessonHandler struct{ Svc *services.LessonService }

func NewLessonHandler() *LessonHandler { return &LessonHandler{Svc: services.NewLessonService()} }

func (h *LessonHandler) List(c *fiber.Ctx) error {
	lessons, err := h.Svc.List(c.Params("chapterID"))
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to fetch lessons", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "lessons fetched successfully", lessons, nil)
}

func (h *LessonHandler) Create(c *fiber.Ctx) error {
	var req models.CreateLessonRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	l, err := h.Svc.Create(c.Params("chapterID"), req)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to create lesson", nil, err.Error())
	}
	return utils.JSON(c, http.StatusCreated, true, "lesson created successfully", l, nil)
}

func (h *LessonHandler) Update(c *fiber.Ctx) error {
	var req models.UpdateLessonRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	l, err := h.Svc.Update(c.Params("id"), req)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to update lesson", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "lesson updated successfully", l, nil)
}

func (h *LessonHandler) Delete(c *fiber.Ctx) error {
	if err := h.Svc.Delete(c.Params("id")); err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to delete lesson", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "lesson deleted successfully", nil, nil)
}

func (h *LessonHandler) UpsertVideoContent(c *fiber.Ctx) error {
	var req models.UpsertVideoContentRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	vc, err := h.Svc.UpsertVideoContent(c.Params("id"), req)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to update video content", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "video content updated successfully", vc, nil)
}

func (h *LessonHandler) UpsertDocumentContent(c *fiber.Ctx) error {
	var req models.UpsertDocumentContentRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	dc, err := h.Svc.UpsertDocumentContent(c.Params("id"), req.Content)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to update document content", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "document content updated successfully", dc, nil)
}

func (h *LessonHandler) Content(c *fiber.Ctx) error {
	courseID := c.Query("course_id")
	if courseID == "" {
		return utils.JSON(c, http.StatusBadRequest, false, "course_id query param required", nil, nil)
	}
	resp, err := h.Svc.Content(c.Params("id"), getUserID(c), courseID)
	if err != nil {
		if err.Error() == "not enrolled" {
			return utils.JSON(c, http.StatusForbidden, false, "not enrolled in this course", nil, nil)
		}
		if err.Error() == "lesson not found" {
			return utils.JSON(c, http.StatusNotFound, false, "lesson not found", nil, nil)
		}
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to fetch lesson content", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "lesson content fetched successfully", resp, nil)
}

func (h *LessonHandler) MarkComplete(c *fiber.Ctx) error {
	courseID := c.Query("course_id")
	if courseID == "" {
		return utils.JSON(c, http.StatusBadRequest, false, "course_id query param required", nil, nil)
	}
	if err := h.Svc.MarkComplete(getUserID(c), c.Params("id"), courseID); err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to mark lesson complete", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "lesson marked as complete", nil, nil)
}

func (h *LessonHandler) AddResource(c *fiber.Ctx) error {
	var req models.AddResourceRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	res, err := h.Svc.AddResource(c.Params("id"), req)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to add resource", nil, err.Error())
	}
	return utils.JSON(c, http.StatusCreated, true, "resource added successfully", res, nil)
}

func (h *LessonHandler) DeleteResource(c *fiber.Ctx) error {
	if err := h.Svc.DeleteResource(c.Params("resourceID")); err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to delete resource", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "resource deleted successfully", nil, nil)
}
