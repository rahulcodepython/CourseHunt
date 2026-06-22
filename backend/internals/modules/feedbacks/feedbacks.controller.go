package feedbacks

import (
	"net/http"

	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (m *FeedbacksModule) CreateController(c *fiber.Ctx) error {
	var req CreateFeedbackRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	f, err := m.CreateService(getUserID(c), c.Params("courseID"), req)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to post feedback", nil, err.Error())
	}
	return utils.JSON(c, http.StatusCreated, true, "feedback posted", f, nil)
}

func (m *FeedbacksModule) ListController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	list, total, err := m.ListService(c.Query("course_id"), page, limit)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to fetch feedbacks", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "feedbacks fetched", models.PaginatedResponse{
		Data: list, Total: total, Page: page, Limit: limit,
	}, nil)
}

func (m *FeedbacksModule) UpdateController(c *fiber.Ctx) error {
	var req struct {
		IsPinned bool `json:"is_pinned"`
	}
	if err := c.BodyParser(&req); err != nil {
		return utils.JSON(c, http.StatusBadRequest, false, "invalid body", nil, err.Error())
	}
	if err := m.UpdateService(c.Params("id"), req.IsPinned); err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to pin feedback", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "feedback pin status updated", map[string]interface{}{"id": c.Params("id"), "is_pinned": req.IsPinned}, nil)
}

func (m *FeedbacksModule) DeleteController(c *fiber.Ctx) error {
	if err := m.DeleteService(c.Params("id")); err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to delete feedback", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "feedback deleted", map[string]string{"id": c.Params("id")}, nil)
}

func getUserID(c *fiber.Ctx) string {
	val := c.Locals("user_id")
	if val == nil {
		return ""
	}
	return val.(string)
}
