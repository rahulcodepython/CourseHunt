package feedbacks

import (
	"errors"
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
	userID := utils.GetUserID(c)
	f, err := m.CreateRepository(userID, req.CourseID, req)
	if err != nil {
		if errors.Is(err, ErrNotEnrolled) {
			return utils.JSON(c, http.StatusForbidden, false, "Access denied. Not enrolled in course.", nil, err.Error())
		}
		return utils.JSON(c, http.StatusInternalServerError, false, "Failed to post feedback.", nil, nil)
	}
	return utils.JSON(c, http.StatusCreated, true, "Feedback posted.", f, nil)
}

func (m *FeedbacksModule) ListController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	list, total, err := m.ListRepository(page, limit, c.Query("is_pinned"), c.Query("user_name"), c.Query("user_email"), c.Query("course_id"))
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "Failed to fetch feedbacks.", nil, nil)
	}
	return utils.JSON(c, http.StatusOK, true, "Feedbacks fetched.", models.PaginatedResponse[[]Feedback]{
		Data: list, Total: total, Page: page, Limit: limit,
	}, nil)
}

func (m *FeedbacksModule) InspectController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	tutorID := utils.GetUserID(c)
	list, total, err := m.InspectRepository(page, limit, tutorID)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "Failed to inspect feedbacks.", nil, nil)
	}
	return utils.JSON(c, http.StatusOK, true, "Feedbacks inspected.", models.PaginatedResponse[[]Feedback]{
		Data: list, Total: total, Page: page, Limit: limit,
	}, nil)
}

func (m *FeedbacksModule) ListPinnedController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	list, total, err := m.ListPinRepository(page, limit)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "Failed to fetch pinned feedbacks.", nil, nil)
	}
	return utils.JSON(c, http.StatusOK, true, "Pinned feedbacks fetched.", models.PaginatedResponse[[]Feedback]{
		Data: list, Total: total, Page: page, Limit: limit,
	}, nil)
}

func (m *FeedbacksModule) UpdateController(c *fiber.Ctx) error {
	var req PinFeedbackRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.JSON(c, http.StatusBadRequest, false, "Invalid request body.", nil, err.Error())
	}
	f, err := m.UpdateRepository(c.Params("id"), req.IsPinned)
	if err != nil {
		if errors.Is(err, ErrFeedbackNotFound) {
			return utils.JSON(c, http.StatusNotFound, false, "Feedback not found.", nil, err.Error())
		}
		return utils.JSON(c, http.StatusInternalServerError, false, "Failed to update feedback pin status.", nil, nil)
	}
	return utils.JSON(c, http.StatusOK, true, "Feedback pin status updated.", f, nil)
}

func (m *FeedbacksModule) DeleteController(c *fiber.Ctx) error {
	id, err := m.DeleteRepository(c.Params("id"))
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "Failed to delete feedback.", nil, nil)
	}
	return utils.JSON(c, http.StatusOK, true, "Feedback deleted.", models.DeleteResponse{ID: id}, nil)
}
