package certificate

import (
	"errors"

	"coursehunt/api/internals/generic"
	"coursehunt/api/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (m *CertificateModule) ClaimController(c *fiber.Ctx) error {
	userID := utils.GetUserID(c)
	courseID := c.Params("courseID")

	cert, err := m.IssueRepository(userID, courseID)
	if err != nil {
		if errors.Is(err, ErrNotEnrolled) {
			return utils.Forbidden(c, "Access denied. Not enrolled in course.", err)
		}
		if errors.Is(err, ErrNotCompleted) {
			return utils.Forbidden(c, "Course not completed.", err)
		}
		return utils.InternalError(c, "Failed to claim certificate.", err)
	}

	return utils.Created(c, "Certificate claimed.", cert)
}

func (m *CertificateModule) ListController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	list, total, err := m.ListRepository(utils.GetUserID(c), page, limit)
	if err != nil {
		return utils.InternalError(c, "Failed to fetch certificates.", err)
	}
	return utils.OK(c, "Certificates fetched.", generic.PaginatedResponse[[]Certificate]{
		Data: list, Total: total, Page: page, Limit: limit,
	})
}
