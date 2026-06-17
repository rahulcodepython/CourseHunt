package handlers

import (
	"net/http"

	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/services"
	"coursehunt-backend/internals/utils"
	"github.com/gofiber/fiber/v2"
)

type DiscussionHandler struct{ Svc *services.DiscussionService }

func NewDiscussionHandler() *DiscussionHandler { return &DiscussionHandler{Svc: services.NewDiscussionService()} }

func (h *DiscussionHandler) List(c *fiber.Ctx) error {
	page, limit := paginationParams(c)
	list, total, err := h.Svc.ListByLesson(c.Params("lessonID"), page, limit)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to fetch discussions", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "discussions fetched", models.PaginatedResponse{
		Data: list, Total: total, Page: page, Limit: limit,
	}, nil)
}

func (h *DiscussionHandler) ListReplies(c *fiber.Ctx) error {
	page, limit := paginationParams(c)
	list, total, err := h.Svc.ListReplies(c.Params("id"), page, limit)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to fetch replies", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "replies fetched", models.PaginatedResponse{
		Data: list, Total: total, Page: page, Limit: limit,
	}, nil)
}

func (h *DiscussionHandler) Create(c *fiber.Ctx) error {
	var req models.CreateDiscussionRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	courseID := c.Query("course_id")
	if courseID == "" {
		return utils.JSON(c, http.StatusBadRequest, false, "course_id query param required", nil, nil)
	}
	d, err := h.Svc.Create(getUserID(c), c.Params("lessonID"), courseID, req)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to post discussion", nil, err.Error())
	}
	return utils.JSON(c, http.StatusCreated, true, "discussion posted", d, nil)
}

func (h *DiscussionHandler) Delete(c *fiber.Ctx) error {
	// Simple permission check: if admin, bypass ownership.
	// In reality, this relies on middleware or passing roles. Here we just rely on ownership unless overridden.
	isAdmin := c.Locals("role") == "admin"
	if err := h.Svc.Delete(c.Params("id"), getUserID(c), isAdmin); err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to delete discussion", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "discussion deleted", nil, nil)
}
