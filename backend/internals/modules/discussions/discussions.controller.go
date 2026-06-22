package discussions

import (
	"net/http"

	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (m *DiscussionsModule) ListController(ctx *fiber.Ctx) error {
	page, limit := utils.PaginationParams(ctx)
	list, total, err := m.ListByLessonService(ctx.Params("lessonID"), page, limit)
	if err != nil {
		return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to fetch discussions", nil, err.Error())
	}
	return utils.JSON(ctx, http.StatusOK, true, "discussions fetched", models.PaginatedResponse{
		Data: list, Total: total, Page: page, Limit: limit,
	}, nil)
}

func (m *DiscussionsModule) ListRepliesController(ctx *fiber.Ctx) error {
	page, limit := utils.PaginationParams(ctx)
	list, total, err := m.ListRepliesService(ctx.Params("id"), page, limit)
	if err != nil {
		return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to fetch replies", nil, err.Error())
	}
	return utils.JSON(ctx, http.StatusOK, true, "replies fetched", models.PaginatedResponse{
		Data: list, Total: total, Page: page, Limit: limit,
	}, nil)
}

func (m *DiscussionsModule) CreateController(ctx *fiber.Ctx) error {
	var req CreateDiscussionRequest
	if ok, err := utils.Validate(ctx, &req); !ok {
		return err
	}
	courseID := ctx.Query("course_id")
	if courseID == "" {
		return utils.JSON(ctx, http.StatusBadRequest, false, "course_id query param required", nil, nil)
	}
	d, err := m.CreateService(utils.GetUserID(ctx), ctx.Params("lessonID"), courseID, req)
	if err != nil {
		return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to post discussion", nil, err.Error())
	}
	return utils.JSON(ctx, http.StatusCreated, true, "discussion posted", d, nil)
}

func (m *DiscussionsModule) DeleteController(ctx *fiber.Ctx) error {
	isAdmin := ctx.Locals("role") == "admin"
	if err := m.DeleteService(ctx.Params("id"), utils.GetUserID(ctx), isAdmin); err != nil {
		return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to delete discussion", nil, err.Error())
	}
	return utils.JSON(ctx, http.StatusOK, true, "discussion deleted", nil, nil)
}
