package enrollments

import (
	"errors"

	"coursehunt/api/internals/generic"
	"coursehunt/api/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (m *EnrollmentsModule) ListController(c *fiber.Ctx) error {
	courseID := c.Params("course_id")
	if courseID == "" {
		return utils.BadRequest(c, "Course ID required.", nil)
	}

	page, limit := utils.PaginationParams(c)
	userID := utils.GetUserID(c)
	perm, _ := c.Locals("permission").(string)
	scope := generic.ScopeFromPermission(perm)

	list, total, err := m.ListRepository(scope, page, limit, courseID, userID, userID,
		c.Query("user_name"), c.Query("user_email"), c.Query("revoked"))
	if err != nil {
		if errors.Is(err, ErrAccessDenied) {
			return utils.Forbidden(c, "Access denied. You do not own this course.", err)
		}
		return utils.InternalError(c, "Failed to fetch enrollments.", err)
	}
	return utils.OK(c, "Enrollments fetched.", generic.PaginatedResponse[[]ListEnrollmentResponse]{
		Data: list, Total: total, Page: page, Limit: limit,
	})
}
