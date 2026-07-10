package enrollments

import (
	"net/http"

	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/utils"

	"github.com/gofiber/fiber/v2"
)

// @Summary CreateController
// @Description CreateController for Enrollments
// @Tags Enrollments
// @Accept json
// @Produce json
// @Param courseID path string true "courseID"
// @Param body body enrollments.ManualEnrollRequest true "Request Body"
// @Success 200 {object} utils.SwaggerResponse[Enrollment]
// @Router /api/v1/enrollments/manual/course/{courseID} [post]
func (m *EnrollmentsModule) CreateController(c *fiber.Ctx) error {
	var req ManualEnrollRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	enrollment, err := m.CreateService(req.UserID, c.Params("courseID"))
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to enroll user", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "user enrolled successfully", enrollment, nil)
}

// @Summary ListController
// @Description ListController for Enrollments
// @Tags Enrollments
// @Accept json
// @Produce json
// @Success 200 {object} utils.PaginatedResponse[Enrollment]
// @Router /api/v1/enrollments [get]
func (m *EnrollmentsModule) ListController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	list, total, err := m.ListService(page, limit)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to fetch enrollments", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "enrollments fetched", models.PaginatedResponse[[]Enrollment]{
		Data: list, Total: total, Page: page, Limit: limit,
	}, nil)
}
