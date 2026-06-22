package enrollments

import (
	"net/http"

	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/utils"

	"github.com/gofiber/fiber/v2"
)

type ManualEnrollRequest struct {
	UserID string `json:"user_id" validate:"required"`
}

func (m *EnrollmentsModule) CreateController(c *fiber.Ctx) error {
	var req ManualEnrollRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	if err := m.CreateService(req.UserID, c.Params("courseID")); err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to enroll user", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "user enrolled successfully", map[string]string{"course_id": c.Params("courseID"), "user_id": req.UserID}, nil)
}

func (m *EnrollmentsModule) ListController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	list, total, err := m.ListService(page, limit)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to fetch enrollments", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "enrollments fetched", models.PaginatedResponse{
		Data: list, Total: total, Page: page, Limit: limit,
	}, nil)
}

// getUserID extracts the user ID from locals (assuming auth middleware sets it)
func getUserID(c *fiber.Ctx) string {
	val := c.Locals("user_id")
	if val == nil {
		return ""
	}
	return val.(string)
}
