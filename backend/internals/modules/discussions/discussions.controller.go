package discussions

import (
	"net/http"

	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/utils"

	"github.com/gofiber/fiber/v2"
)

// @Summary ListController
// @Description ListController for Discussions
// @Tags Discussions
// @Accept json
// @Produce json
// @Param lessonID path string true "lessonID"
// @Success 200 {object} utils.PaginatedResponse[DiscussionResponse]
// @Router /api/v1/discussions/lesson/{lessonID} [get]
func (m *DiscussionsModule) ListController(ctx *fiber.Ctx) error {
	page, limit := utils.PaginationParams(ctx)
	list, total, err := m.ListByLessonService(ctx.Params("lessonID"), page, limit)
	if err != nil {
		return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to fetch discussions", nil, err.Error())
	}
	return utils.JSON(ctx, http.StatusOK, true, "discussions fetched", models.PaginatedResponse[[]DiscussionResponse]{
		Data: list, Total: total, Page: page, Limit: limit,
	}, nil)
}

// @Summary ListRepliesController
// @Description ListRepliesController for Discussions
// @Tags Discussions
// @Accept json
// @Produce json
// @Param id path string true "id"
// @Success 200 {object} utils.PaginatedResponse[DiscussionResponse]
// @Router /api/v1/discussions/replies/{id} [get]
func (m *DiscussionsModule) ListRepliesController(ctx *fiber.Ctx) error {
	page, limit := utils.PaginationParams(ctx)
	list, total, err := m.ListRepliesService(ctx.Params("id"), page, limit)
	if err != nil {
		return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to fetch replies", nil, err.Error())
	}
	return utils.JSON(ctx, http.StatusOK, true, "replies fetched", models.PaginatedResponse[[]DiscussionResponse]{
		Data: list, Total: total, Page: page, Limit: limit,
	}, nil)
}

// @Summary CreateController
// @Description CreateController for Discussions
// @Tags Discussions
// @Accept json
// @Produce json
// @Param lessonID path string true "lessonID"
// @Param body body discussions.CreateDiscussionRequest true "Request Body"
// @Success 200 {object} utils.SwaggerResponse[Discussion]
// @Router /api/v1/discussions/lesson/{lessonID} [post]
func (m *DiscussionsModule) CreateController(ctx *fiber.Ctx) error {
	var req CreateDiscussionRequest
	if ok, err := utils.Validate(ctx, &req); !ok {
		return err
	}
	userID := utils.GetUserID(ctx)
	courseID := ctx.Params("courseID")
	if !m.Enrollments.IsEnrolledRepository(userID, courseID) && !m.Courses.IsCourseOwnerRepository(userID, courseID) {
		return utils.JSON(ctx, http.StatusForbidden, false, "access denied: not enrolled or owner", nil, nil)
	}
	d, err := m.CreateService(userID, ctx.Params("lessonID"), courseID, req)
	if err != nil {
		return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to post discussion", nil, err.Error())
	}
	return utils.JSON(ctx, http.StatusCreated, true, "discussion posted", d, nil)
}

// @Summary UpdateController
// @Description UpdateController for Discussions
// @Tags Discussions
// @Accept json
// @Produce json
// @Param id path string true "id"
// @Param body body discussions.UpdateDiscussionRequest true "Request Body"
// @Success 200 {object} utils.SwaggerResponse[Discussion]
// @Router /api/v1/discussions/{id} [patch]
func (m *DiscussionsModule) UpdateController(ctx *fiber.Ctx) error {
	var req UpdateDiscussionRequest
	if ok, err := utils.Validate(ctx, &req); !ok {
		return err
	}
	userID := utils.GetUserID(ctx)
	courseID := ctx.Params("courseID")
	if !m.Courses.IsCourseOwnerRepository(userID, courseID) {
		return utils.JSON(ctx, http.StatusForbidden, false, "access denied: you do not own this course", nil, nil)
	}
	d, err := m.UpdateService(ctx.Params("id"), userID, req.Content)
	if err != nil {
		return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to update discussion", nil, err.Error())
	}
	return utils.JSON(ctx, http.StatusOK, true, "discussion updated", d, nil)
}

// @Summary DeleteController
// @Description DeleteController for Discussions
// @Tags Discussions
// @Accept json
// @Produce json
// @Param id path string true "id"
// @Success 200 {object} utils.SwaggerResponse[utils.DeleteResponse]
// @Router /api/v1/discussions/{id} [delete]
func (m *DiscussionsModule) DeleteController(ctx *fiber.Ctx) error {
	isAdmin := ctx.Locals("role") == "admin"
	id, err := m.DeleteService(ctx.Params("id"), utils.GetUserID(ctx), isAdmin)
	if err != nil {
		return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to delete discussion", nil, err.Error())
	}
	return utils.JSON(ctx, http.StatusOK, true, "discussion deleted", map[string]string{"id": id}, nil)
}
