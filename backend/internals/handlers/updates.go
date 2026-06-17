package handlers

import (
	"net/http"

	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/services"
	"coursehunt-backend/internals/utils"
	"github.com/gofiber/fiber/v2"
)

type UpdateHandler struct{ Svc *services.UpdateService }

func NewUpdateHandler() *UpdateHandler { return &UpdateHandler{Svc: services.NewUpdateService()} }

func (h *UpdateHandler) Create(c *fiber.Ctx) error {
	var req models.CreateUpdateRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	u, err := h.Svc.Create(getUserID(c), req)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to create update", nil, err.Error())
	}
	return utils.JSON(c, http.StatusCreated, true, "update created", u, nil)
}

func (h *UpdateHandler) Update(c *fiber.Ctx) error {
	var req models.UpdateUpdateRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	u, err := h.Svc.Update(c.Params("id"), req.Message)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to modify update", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "update modified", u, nil)
}

func (h *UpdateHandler) Delete(c *fiber.Ctx) error {
	if err := h.Svc.Delete(c.Params("id")); err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to delete update", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "update deleted", nil, nil)
}

func (h *UpdateHandler) Feed(c *fiber.Ctx) error {
	page, limit := paginationParams(c)
	feed, err := h.Svc.GetFeed(getUserID(c), page, limit)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to fetch update feed", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "update feed fetched", feed, nil)
}

func (h *UpdateHandler) List(c *fiber.Ctx) error {
	page, limit := paginationParams(c)
	list, total, err := h.Svc.List(page, limit)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to fetch updates", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "updates fetched", models.PaginatedResponse{
		Data: list, Total: total, Page: page, Limit: limit,
	}, nil)
}
