package discussions

import (
	"errors"
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
// @Param lesson_id query string true "lesson_id"
// @Success 200 {object} utils.PaginatedResponse[Discussion]
// @Router /api/v1/discussions [get]
func (m *DiscussionsModule) ListController(ctx *fiber.Ctx) error {
	page, limit := utils.PaginationParams(ctx)
	lessonID := ctx.Query("lesson_id")
	if lessonID == "" {
		return utils.JSON(ctx, http.StatusBadRequest, false, "Provide a valid lesson id.", nil, nil)
	}
	userID := utils.GetUserID(ctx)
	list, total, err := m.ListByLessonRepository(lessonID, userID, page, limit)
	if err != nil {
		switch {
		case errors.Is(err, ErrLessonNotFound):
			return utils.JSON(ctx, http.StatusNotFound, false, "lesson not found", nil, nil)
		case errors.Is(err, ErrNotEnrolled):
			return utils.JSON(ctx, http.StatusForbidden, false, "access denied: not enrolled in this course", nil, nil)
		default:
			return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to fetch discussions", nil, err.Error())
		}
	}
	return utils.JSON(ctx, http.StatusOK, true, "discussions fetched", models.PaginatedResponse[[]Discussion]{
		Data: list, Total: total, Page: page, Limit: limit,
	}, nil)
}

// @Summary AdminListController
// @Description AdminListController for Discussions (no enrollment check)
// @Tags Discussions
// @Accept json
// @Produce json
// @Param lesson_id query string true "lesson_id"
// @Success 200 {object} utils.PaginatedResponse[Discussion]
// @Router /api/v1/discussions/admin [get]
func (m *DiscussionsModule) AdminListController(ctx *fiber.Ctx) error {
	page, limit := utils.PaginationParams(ctx)
	lessonID := ctx.Query("lesson_id")
	if lessonID == "" {
		return utils.JSON(ctx, http.StatusBadRequest, false, "Provide a valid lesson id.", nil, nil)
	}
	list, total, err := m.ListByLessonAdminRepository(lessonID, page, limit)
	if err != nil {
		return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to fetch discussions", nil, err.Error())
	}
	return utils.JSON(ctx, http.StatusOK, true, "discussions fetched", models.PaginatedResponse[[]Discussion]{
		Data: list, Total: total, Page: page, Limit: limit,
	}, nil)
}

// @Summary ListRepliesController
// @Description ListRepliesController for Discussions
// @Tags Discussions
// @Accept json
// @Produce json
// @Param id path string true "id"
// @Success 200 {object} utils.PaginatedResponse[Discussion]
// @Router /api/v1/discussions/replies/{id} [get]
func (m *DiscussionsModule) ListRepliesController(ctx *fiber.Ctx) error {
	page, limit := utils.PaginationParams(ctx)
	userID := utils.GetUserID(ctx)
	list, total, err := m.ListRepliesRepository(ctx.Params("id"), userID, page, limit)
	if err != nil {
		switch {
		case errors.Is(err, ErrDiscussionNotFound):
			return utils.JSON(ctx, http.StatusNotFound, false, "parent discussion not found", nil, nil)
		case errors.Is(err, ErrNotEnrolled):
			return utils.JSON(ctx, http.StatusForbidden, false, "access denied: not enrolled in this course", nil, nil)
		default:
			return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to fetch replies", nil, err.Error())
		}
	}
	return utils.JSON(ctx, http.StatusOK, true, "replies fetched", models.PaginatedResponse[[]Discussion]{
		Data: list, Total: total, Page: page, Limit: limit,
	}, nil)
}

// @Summary CreateController
// @Description CreateController for Discussions
// @Tags Discussions
// @Accept json
// @Produce json
// @Param body body discussions.CreateDiscussionRequest true "Request Body"
// @Success 201 {object} utils.SwaggerResponse[Discussion]
// @Router /api/v1/discussions [post]
func (m *DiscussionsModule) CreateController(ctx *fiber.Ctx) error {
	var req CreateDiscussionRequest
	if ok, err := utils.Validate(ctx, &req); !ok {
		return err
	}
	if req.LessonID == "" {
		return utils.JSON(ctx, http.StatusBadRequest, false, "lesson_id is required", nil, nil)
	}
	userID := utils.GetUserID(ctx)
	d, err := m.CreateRepository(userID, req.LessonID, req)
	if err != nil {
		switch {
		case errors.Is(err, ErrLessonNotFound):
			return utils.JSON(ctx, http.StatusNotFound, false, "lesson not found", nil, nil)
		case errors.Is(err, ErrNotEnrolled):
			return utils.JSON(ctx, http.StatusForbidden, false, "access denied: not enrolled in this course", nil, nil)
		default:
			return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to post discussion", nil, err.Error())
		}
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
	d, err := m.UpdateRepository(ctx.Params("id"), userID, req.Content)
	if err != nil {
		switch {
		case errors.Is(err, ErrDiscussionNotFound):
			return utils.JSON(ctx, http.StatusNotFound, false, "discussion not found", nil, nil)
		case errors.Is(err, ErrAccessDenied):
			return utils.JSON(ctx, http.StatusForbidden, false, "access denied: you cannot update this discussion", nil, nil)
		case errors.Is(err, ErrNotEnrolled):
			return utils.JSON(ctx, http.StatusForbidden, false, "access denied: not enrolled in this course", nil, nil)
		default:
			return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to update discussion", nil, err.Error())
		}
	}
	return utils.JSON(ctx, http.StatusOK, true, "discussion updated", d, nil)
}

// @Summary DeleteController
// @Description DeleteController for Discussions (regular users)
// @Tags Discussions
// @Accept json
// @Produce json
// @Param id path string true "id"
// @Success 200 {object} utils.SwaggerResponse[utils.DeleteResponse]
// @Router /api/v1/discussions/{id} [delete]
func (m *DiscussionsModule) DeleteController(ctx *fiber.Ctx) error {
	userID := utils.GetUserID(ctx)
	id, err := m.DeleteRepository(ctx.Params("id"), userID)
	if err != nil {
		switch {
		case errors.Is(err, ErrDiscussionNotFound):
			return utils.JSON(ctx, http.StatusNotFound, false, "discussion not found", nil, nil)
		case errors.Is(err, ErrAccessDenied):
			return utils.JSON(ctx, http.StatusForbidden, false, "access denied: you cannot delete this discussion", nil, nil)
		case errors.Is(err, ErrNotEnrolled):
			return utils.JSON(ctx, http.StatusForbidden, false, "access denied: not enrolled in this course", nil, nil)
		default:
			return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to delete discussion", nil, err.Error())
		}
	}
	return utils.JSON(ctx, http.StatusOK, true, "discussion deleted", map[string]string{"id": id}, nil)
}

// @Summary TutorDeleteController
// @Description TutorDeleteController for Discussions (tutors deleting comments in their courses)
// @Tags Discussions
// @Accept json
// @Produce json
// @Param id path string true "id"
// @Success 200 {object} utils.SwaggerResponse[utils.DeleteResponse]
// @Router /api/v1/discussions/tutor/{id} [delete]
func (m *DiscussionsModule) TutorDeleteController(ctx *fiber.Ctx) error {
	tutorID := utils.GetUserID(ctx)
	id, err := m.TutorDeleteRepository(ctx.Params("id"), tutorID)
	if err != nil {
		switch {
		case errors.Is(err, ErrDiscussionNotFound):
			return utils.JSON(ctx, http.StatusNotFound, false, "discussion not found", nil, nil)
		case errors.Is(err, ErrAccessDenied):
			return utils.JSON(ctx, http.StatusForbidden, false, "access denied: you do not own the course this discussion belongs to", nil, nil)
		default:
			return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to delete discussion", nil, err.Error())
		}
	}
	return utils.JSON(ctx, http.StatusOK, true, "discussion deleted by tutor", map[string]string{"id": id}, nil)
}

// @Summary AdminDeleteController
// @Description AdminDeleteController for Discussions (admins deleting comments anywhere)
// @Tags Discussions
// @Accept json
// @Produce json
// @Param id path string true "id"
// @Success 200 {object} utils.SwaggerResponse[utils.DeleteResponse]
// @Router /api/v1/discussions/admin/{id} [delete]
func (m *DiscussionsModule) AdminDeleteController(ctx *fiber.Ctx) error {
	id, err := m.AdminDeleteRepository(ctx.Params("id"))
	if err != nil {
		switch {
		case errors.Is(err, ErrDiscussionNotFound):
			return utils.JSON(ctx, http.StatusNotFound, false, "discussion not found", nil, nil)
		default:
			return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to delete discussion", nil, err.Error())
		}
	}
	return utils.JSON(ctx, http.StatusOK, true, "discussion deleted by admin", map[string]string{"id": id}, nil)
}
