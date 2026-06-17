package handlers

import (
	"net/http"

	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/services"
	"coursehunt-backend/internals/utils"
	"github.com/gofiber/fiber/v2"
)

type FeedbackHandler struct{ Svc *services.FeedbackService }

func NewFeedbackHandler() *FeedbackHandler { return &FeedbackHandler{Svc: services.NewFeedbackService()} }

func (h *FeedbackHandler) Create(c *fiber.Ctx) error {
	var req models.CreateFeedbackRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	f, err := h.Svc.Create(getUserID(c), c.Params("courseID"), req)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to post feedback", nil, err.Error())
	}
	return utils.JSON(c, http.StatusCreated, true, "feedback posted", f, nil)
}

func (h *FeedbackHandler) List(c *fiber.Ctx) error {
	page, limit := paginationParams(c)
	list, total, err := h.Svc.List(c.Query("course_id"), page, limit)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to fetch feedbacks", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "feedbacks fetched", models.PaginatedResponse{
		Data: list, Total: total, Page: page, Limit: limit,
	}, nil)
}

func (h *FeedbackHandler) Pin(c *fiber.Ctx) error {
	var req struct {
		IsPinned bool `json:"is_pinned"`
	}
	if err := c.BodyParser(&req); err != nil {
		return utils.JSON(c, http.StatusBadRequest, false, "invalid body", nil, err.Error())
	}
	if err := h.Svc.Pin(c.Params("id"), req.IsPinned); err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to pin feedback", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "feedback pin status updated", nil, nil)
}

func (h *FeedbackHandler) Delete(c *fiber.Ctx) error {
	if err := h.Svc.Delete(c.Params("id")); err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to delete feedback", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "feedback deleted", nil, nil)
}
