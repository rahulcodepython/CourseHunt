package feedbacks

import (
	"errors"
	"net/http"

	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/utils"

	"github.com/gofiber/fiber/v2"
)

// @Summary CreateController
// @Description Create or update feedback for a course
// @Tags Feedbacks
// @Accept json
// @Produce json
// @Param body body feedbacks.CreateFeedbackRequest true "Request Body"
// @Success 201 {object} utils.SwaggerResponse[Feedback]
// @Router /api/v1/feedbacks [post]
func (m *FeedbacksModule) CreateController(c *fiber.Ctx) error {
	var req CreateFeedbackRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	userID := utils.GetUserID(c)
	f, err := m.CreateRepository(userID, req.CourseID, req)
	if err != nil {
		switch {
		case errors.Is(err, ErrNotEnrolled):
			return utils.JSON(c, http.StatusForbidden, false, "access denied: not enrolled in course", nil, nil)
		default:
			return utils.JSON(c, http.StatusInternalServerError, false, "failed to post feedback", nil, err.Error())
		}
	}
	return utils.JSON(c, http.StatusCreated, true, "feedback posted", f, nil)
}

// @Summary ListController
// @Description Retrieve a list of all feedbacks
// @Tags Feedbacks
// @Accept json
// @Produce json
// @Success 200 {object} utils.PaginatedResponse[Feedback]
// @Router /api/v1/feedbacks [get]
func (m *FeedbacksModule) ListController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	list, total, err := m.ListRepository(page, limit)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to fetch feedbacks", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "feedbacks fetched", models.PaginatedResponse[[]Feedback]{
		Data: list, Total: total, Page: page, Limit: limit,
	}, nil)
}

// @Summary InspectController
// @Description Tutor inspect feedbacks for their courses
// @Tags Feedbacks
// @Accept json
// @Produce json
// @Success 200 {object} utils.PaginatedResponse[Feedback]
// @Router /api/v1/feedbacks/inspect [get]
func (m *FeedbacksModule) InspectController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	tutorID := utils.GetUserID(c)
	list, total, err := m.InspectRepository(page, limit, tutorID)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to inspect feedbacks", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "feedbacks inspected", models.PaginatedResponse[[]Feedback]{
		Data: list, Total: total, Page: page, Limit: limit,
	}, nil)
}

// @Summary ListPinnedController
// @Description Retrieve pinned feedbacks
// @Tags Feedbacks
// @Accept json
// @Produce json
// @Success 200 {object} utils.SwaggerResponse[[]Feedback]
// @Router /api/v1/pinned-feedbacks [get]
func (m *FeedbacksModule) ListPinnedController(c *fiber.Ctx) error {
	list, err := m.ListPinRepository()
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to fetch feedbacks", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "feedbacks fetched", list, nil)
}

// @Summary UpdateController
// @Description Update feedback pin status
// @Tags Feedbacks
// @Accept json
// @Produce json
// @Param id path string true "id"
// @Param body body feedbacks.PinFeedbackRequest true "Request Body"
// @Success 200 {object} utils.SwaggerResponse[Feedback]
// @Router /api/v1/feedbacks/{id}/pin [patch]
func (m *FeedbacksModule) UpdateController(c *fiber.Ctx) error {
	var req PinFeedbackRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.JSON(c, http.StatusBadRequest, false, "invalid body", nil, err.Error())
	}
	f, err := m.UpdateRepository(c.Params("id"), req.IsPinned)
	if err != nil {
		switch {
		case errors.Is(err, ErrFeedbackNotFound):
			return utils.JSON(c, http.StatusNotFound, false, "feedback not found", nil, nil)
		default:
			return utils.JSON(c, http.StatusInternalServerError, false, "failed to pin feedback", nil, err.Error())
		}
	}
	return utils.JSON(c, http.StatusOK, true, "feedback pin status updated", f, nil)
}

// @Summary DeleteController
// @Description Delete feedback by ID
// @Tags Feedbacks
// @Accept json
// @Produce json
// @Param id path string true "id"
// @Success 200 {object} utils.SwaggerResponse[utils.DeleteResponse]
// @Router /api/v1/feedbacks/{id} [delete]
func (m *FeedbacksModule) DeleteController(c *fiber.Ctx) error {
	id, err := m.DeleteRepository(c.Params("id"))
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to delete feedback", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "feedback deleted", map[string]string{"id": id}, nil)
}
