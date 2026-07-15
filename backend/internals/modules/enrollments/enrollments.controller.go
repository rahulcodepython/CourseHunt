package enrollments

import (
	"errors"
	"net/http"

	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (m *EnrollmentsModule) ListController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	userID := utils.GetUserID(c)
	list, total, err := m.ListRepository(page, limit, c.Query("course_id"), userID,
		c.Query("user_name"), c.Query("user_email"), c.Query("revoked"))
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "Failed to fetch enrollments.", nil, nil)
	}
	return utils.JSON(c, http.StatusOK, true, "Enrollments fetched.", models.PaginatedResponse[[]ListEnrollmentResponse]{
		Data: list, Total: total, Page: page, Limit: limit,
	}, nil)
}

func (m *EnrollmentsModule) InspectController(c *fiber.Ctx) error {
	courseID := c.Query("course_id")
	if courseID == "" {
		return utils.JSON(c, http.StatusBadRequest, false, "Course ID query param required.", nil, nil)
	}
	page, limit := utils.PaginationParams(c)
	tutorID := utils.GetUserID(c)
	list, total, err := m.InspectRepository(page, limit, courseID, tutorID,
		c.Query("user_name"), c.Query("user_email"), c.Query("revoked"))
	if err != nil {
		if errors.Is(err, ErrAccessDenied) {
			return utils.JSON(c, http.StatusForbidden, false, "Access denied. You do not own this course.", nil, err.Error())
		}
		return utils.JSON(c, http.StatusInternalServerError, false, "Failed to inspect enrollments.", nil, nil)
	}
	return utils.JSON(c, http.StatusOK, true, "Enrollments inspected.", models.PaginatedResponse[[]ListEnrollmentResponse]{
		Data: list, Total: total, Page: page, Limit: limit,
	}, nil)
}
