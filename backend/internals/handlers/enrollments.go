package handlers

import (
	"net/http"

	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/services"
	"coursehunt-backend/internals/utils"
	"github.com/gofiber/fiber/v2"
)

type EnrollmentHandler struct{ Svc *services.EnrollmentService }

func NewEnrollmentHandler() *EnrollmentHandler {
	return &EnrollmentHandler{Svc: services.NewEnrollmentService()}
}

// POST /api/enrollments/manual
func (h *EnrollmentHandler) ManualEnroll(c *fiber.Ctx) error {
	var req models.ManualEnrollRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	if err := h.Svc.ManualEnroll(req.UserID, c.Params("courseID")); err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to enroll user", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "user enrolled successfully", nil, nil)
}

// GET /api/enrollments
func (h *EnrollmentHandler) List(c *fiber.Ctx) error {
	page, limit := paginationParams(c)
	list, total, err := h.Svc.List(page, limit)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to fetch enrollments", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "enrollments fetched", models.PaginatedResponse{
		Data: list, Total: total, Page: page, Limit: limit,
	}, nil)
}
