package certificate

import (
	"errors"
	"net/http"

	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (m *CertificateModule) ClaimController(c *fiber.Ctx) error {
	userID := utils.GetUserID(c)
	courseID := c.Params("courseID")

	cert, err := m.IssueRepository(userID, courseID)
	if err != nil {
		if errors.Is(err, ErrNotEnrolled) {
			return utils.JSON(c, http.StatusForbidden, false, "Access denied. Not enrolled in course.", nil, err.Error())
		}
		if errors.Is(err, ErrNotCompleted) {
			return utils.JSON(c, http.StatusForbidden, false, "Course not completed.", nil, err.Error())
		}
		return utils.JSON(c, http.StatusInternalServerError, false, "Failed to claim certificate.", nil, nil)
	}

	return utils.JSON(c, http.StatusCreated, true, "Certificate claimed.", cert, nil)
}

func (m *CertificateModule) ListController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	list, total, err := m.ListRepository(utils.GetUserID(c), page, limit)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "Failed to fetch certificates.", nil, nil)
	}
	return utils.JSON(c, http.StatusOK, true, "Certificates fetched.", models.PaginatedResponse[[]Certificate]{
		Data: list, Total: total, Page: page, Limit: limit,
	}, nil)
}
