package feedbacks

import (
	"net/http"

	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/utils"

	"github.com/gofiber/fiber/v2"
)

// @Summary CreateController
// @Description CreateController for Feedbacks
// @Tags Feedbacks
// @Accept json
// @Produce json
// @Param courseID path string true "courseID"
// @Param body body feedbacks.CreateFeedbackRequest true "Request Body"
// @Success 200 {object} utils.SwaggerResponse[Feedback]
// @Router /api/v1/feedbacks/course/{courseID} [post]
func (m *FeedbacksModule) CreateController(c *fiber.Ctx) error {
	var req CreateFeedbackRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	userID := utils.GetUserID(c)
	if !m.Enrollments.IsEnrolledRepository(userID, c.Params("courseID")) {
		return utils.JSON(c, http.StatusForbidden, false, "access denied: not enrolled in course", nil, nil)
	}
	f, err := m.CreateService(userID, c.Params("courseID"), req)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to post feedback", nil, err.Error())
	}
	return utils.JSON(c, http.StatusCreated, true, "feedback posted", f, nil)
}

// @Summary ListController
// @Description ListController for Feedbacks
// @Tags Feedbacks
// @Accept json
// @Produce json
// @Success 200 {object} utils.PaginatedResponse[Feedback]
// @Router /api/v1/feedbacks [get]
func (m *FeedbacksModule) ListController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	list, total, err := m.ListService(c.Query("course_id"), page, limit)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to fetch feedbacks", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "feedbacks fetched", models.PaginatedResponse[[]Feedback]{
		Data: list, Total: total, Page: page, Limit: limit,
	}, nil)
}

// @Summary UpdateController
// @Description UpdateController for Feedbacks
// @Tags Feedbacks
// @Accept json
// @Produce json
// @Param id path string true "id"
// @Success 200 {object} utils.SwaggerResponse[Feedback]
// @Router /api/v1/feedbacks/{id}/pin [patch]
func (m *FeedbacksModule) UpdateController(c *fiber.Ctx) error {
	var req struct {
		IsPinned bool `json:"is_pinned"`
	}
	if err := c.BodyParser(&req); err != nil {
		return utils.JSON(c, http.StatusBadRequest, false, "invalid body", nil, err.Error())
	}
	userID := utils.GetUserID(c)
	courseID := c.Params("courseID")
	if !m.Courses.IsCourseOwnerRepository(userID, courseID) {
		return utils.JSON(c, http.StatusForbidden, false, "access denied: you do not own this course", nil, nil)
	}
	f, err := m.UpdateService(c.Params("id"), req.IsPinned)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to pin feedback", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "feedback pin status updated", f, nil)
}

// @Summary DeleteController
// @Description DeleteController for Feedbacks
// @Tags Feedbacks
// @Accept json
// @Produce json
// @Param id path string true "id"
// @Success 200 {object} utils.SwaggerResponse[utils.DeleteResponse]
// @Router /api/v1/feedbacks/{id} [delete]
func (m *FeedbacksModule) DeleteController(c *fiber.Ctx) error {
	userID := utils.GetUserID(c)
	courseID := c.Params("courseID")
	if !m.Courses.IsCourseOwnerRepository(userID, courseID) {
		return utils.JSON(c, http.StatusForbidden, false, "access denied: you do not own this course", nil, nil)
	}
	id, err := m.DeleteService(c.Params("id"))
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to delete feedback", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "feedback deleted", map[string]string{"id": id}, nil)
}
