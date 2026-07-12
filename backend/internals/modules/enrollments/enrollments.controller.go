package enrollments

import (
	"errors"
	"net/http"

	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/utils"

	"github.com/gofiber/fiber/v2"
)

// @Summary ListController
// @Description ListController for Enrollments
// @Tags Enrollments
// @Accept json
// @Produce json
// @Param course_id query string true "course_id"
// @Success 200 {object} utils.PaginatedResponse[ListEnrollmentResponse]
// @Router /api/v1/enrollments [get]
func (m *EnrollmentsModule) ListController(ctx *fiber.Ctx) error {
	courseID := ctx.Query("course_id")
	if courseID == "" {
		return utils.JSON(ctx, http.StatusBadRequest, false, "course_id query parameter is mandatory", nil, nil)
	}
	page, limit := utils.PaginationParams(ctx)
	list, total, err := m.ListRepository(page, limit, courseID)
	if err != nil {
		return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to fetch enrollments", nil, err.Error())
	}
	return utils.JSON(ctx, http.StatusOK, true, "enrollments fetched", models.PaginatedResponse[[]ListEnrollmentResponse]{
		Data: list, Total: total, Page: page, Limit: limit,
	}, nil)
}

// @Summary InspectController
// @Description Tutor inspect enrollments for their course
// @Tags Enrollments
// @Accept json
// @Produce json
// @Param course_id query string true "course_id"
// @Success 200 {object} utils.PaginatedResponse[ListEnrollmentResponse]
// @Router /api/v1/enrollments/inspect [get]
func (m *EnrollmentsModule) InspectController(ctx *fiber.Ctx) error {
	courseID := ctx.Query("course_id")
	if courseID == "" {
		return utils.JSON(ctx, http.StatusBadRequest, false, "course_id query parameter is mandatory", nil, nil)
	}
	page, limit := utils.PaginationParams(ctx)
	tutorID := utils.GetUserID(ctx)
	list, total, err := m.InspectRepository(page, limit, courseID, tutorID)
	if err != nil {
		if errors.Is(err, ErrAccessDenied) {
			return utils.JSON(ctx, http.StatusForbidden, false, "access denied: you do not own this course", nil, nil)
		}
		return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to inspect enrollments", nil, err.Error())
	}
	return utils.JSON(ctx, http.StatusOK, true, "enrollments inspected", models.PaginatedResponse[[]ListEnrollmentResponse]{
		Data: list, Total: total, Page: page, Limit: limit,
	}, nil)
}
