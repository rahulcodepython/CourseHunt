package enrollments

import (
	"errors"

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
		return utils.InternalError(c, "Failed to fetch enrollments.", err)
	}
	return utils.OK(c, "Enrollments fetched.", models.PaginatedResponse[[]ListEnrollmentResponse]{
		Data: list, Total: total, Page: page, Limit: limit,
	})
}

func (m *EnrollmentsModule) InspectController(c *fiber.Ctx) error {
	courseID := c.Query("course_id")
	if courseID == "" {
		return utils.BadRequest(c, "Course ID query param required.", nil)
	}
	page, limit := utils.PaginationParams(c)
	tutorID := utils.GetUserID(c)
	list, total, err := m.InspectRepository(page, limit, courseID, tutorID,
		c.Query("user_name"), c.Query("user_email"), c.Query("revoked"))
	if err != nil {
		if errors.Is(err, ErrAccessDenied) {
			return utils.Forbidden(c, "Access denied. You do not own this course.", err)
		}
		return utils.InternalError(c, "Failed to inspect enrollments.", err)
	}
	return utils.OK(c, "Enrollments inspected.", models.PaginatedResponse[[]ListEnrollmentResponse]{
		Data: list, Total: total, Page: page, Limit: limit,
	})
}
