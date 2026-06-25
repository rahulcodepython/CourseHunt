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
	f, err := m.CreateService(utils.GetUserID(c), c.Params("courseID"), req)
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
	f, err := m.UpdateService(c.Params("id"), req.IsPinned)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to pin feedback", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "feedback pin status updated", f, nil)
}

func (m *FeedbacksModule) DeleteController(c *fiber.Ctx) error {
	id, err := m.DeleteService(c.Params("id"))
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to delete feedback", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "feedback deleted", map[string]string{"id": id}, nil)
}
