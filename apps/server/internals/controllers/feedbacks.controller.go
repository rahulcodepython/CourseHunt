package controllers

import (
	"errors"
	"fmt"
	"time"

	"coursehunt/server/internals/config"
	"coursehunt/server/internals/entities"
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/repositories"
	"coursehunt/server/internals/utils"

	"github.com/gofiber/fiber/v2"
)

type FeedbacksController struct {
	Repo *repositories.FeedbacksRepository
	Cfg  *config.Config
}

func NewFeedbacksController(repo *repositories.FeedbacksRepository, cfg *config.Config) *FeedbacksController {
	return &FeedbacksController{Repo: repo, Cfg: cfg}
}

type feedbacksListCacheData struct {
	Data  []entities.Feedback `json:"data"`
	Total int                 `json:"total"`
}

func (ctrl *FeedbacksController) CreateController(c *fiber.Ctx) error {
	var req entities.CreateFeedbackRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	userID := utils.GetUserID(c)
	f, err := ctrl.Repo.CreateRepository(userID, req.CourseID, req)
	if err != nil {
		if errors.Is(err, generic.ErrFeedbacksNotEnrolled) {
			return utils.Forbidden(c, "Access denied. Not enrolled in course.", err)
		}
		return utils.InternalError(c, "Failed to post feedback.", err)
	}

	ctrl.Repo.Cache.InvalidateFeedbacks(c.Context())

	return utils.Created(c, "Feedback posted.", f)
}

func (ctrl *FeedbacksController) ListController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	perm, _ := c.Locals("permission").(string)
	scope := generic.ScopeFromPermission(perm)
	userID := utils.GetUserID(c)
	isPinned := c.Query("is_pinned")
	userName := c.Query("user_name")
	userEmail := c.Query("user_email")
	courseID := c.Query("course_id")

	cacheKey := fmt.Sprintf("feedbacks:list:p:%d:l:%d:s:%v:u:%s:pin:%s:c:%s", page, limit, scope, userID, isPinned, courseID)

	var cached feedbacksListCacheData
	if hit, _ := ctrl.Repo.Cache.Get(c.Context(), cacheKey, &cached); hit {
		return utils.OK(c, "Feedbacks fetched.", generic.PaginatedResponse[[]entities.Feedback]{
			Data: cached.Data, Total: cached.Total, Page: page, Limit: limit,
		})
	}

	list, total, err := ctrl.Repo.ListRepository(scope, userID, page, limit, isPinned, userName, userEmail, courseID)
	if err != nil {
		return utils.InternalError(c, "Failed to fetch feedbacks.", err)
	}

	_ = ctrl.Repo.Cache.Set(c.Context(), cacheKey, feedbacksListCacheData{Data: list, Total: total}, 5*time.Minute)

	return utils.OK(c, "Feedbacks fetched.", generic.PaginatedResponse[[]entities.Feedback]{
		Data: list, Total: total, Page: page, Limit: limit,
	})
}

func (ctrl *FeedbacksController) ListPinnedController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	courseID := c.Query("course_id")
	cacheKey := fmt.Sprintf("feedbacks:pinned:p:%d:l:%d:c:%s", page, limit, courseID)

	var cached feedbacksListCacheData
	if hit, _ := ctrl.Repo.Cache.Get(c.Context(), cacheKey, &cached); hit {
		return utils.OK(c, "Pinned feedbacks fetched.", generic.PaginatedResponse[[]entities.Feedback]{
			Data: cached.Data, Total: cached.Total, Page: page, Limit: limit,
		})
	}

	list, total, err := ctrl.Repo.ListRepository(generic.ScopeAdmin, "", page, limit, "true", "", "", courseID)
	if err != nil {
		return utils.InternalError(c, "Failed to fetch pinned feedbacks.", err)
	}

	_ = ctrl.Repo.Cache.Set(c.Context(), cacheKey, feedbacksListCacheData{Data: list, Total: total}, 10*time.Minute)

	return utils.OK(c, "Pinned feedbacks fetched.", generic.PaginatedResponse[[]entities.Feedback]{
		Data: list, Total: total, Page: page, Limit: limit,
	})
}

func (ctrl *FeedbacksController) UpdateController(c *fiber.Ctx) error {
	var req entities.PinFeedbackRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.BadRequest(c, "Invalid request body.", err)
	}
	f, err := ctrl.Repo.UpdateRepository(c.Params("id"), req.IsPinned)
	if err != nil {
		if errors.Is(err, generic.ErrFeedbacksFeedbackNotFound) {
			return utils.NotFound(c, "Feedback not found.", err)
		}
		return utils.InternalError(c, "Failed to update feedback pin status.", err)
	}

	ctrl.Repo.Cache.InvalidateFeedbacks(c.Context())

	return utils.OK(c, "Feedback pin status updated.", f)
}

func (ctrl *FeedbacksController) DeleteController(c *fiber.Ctx) error {
	perm, _ := c.Locals("permission").(string)
	scope := generic.ScopeFromPermission(perm)
	id, err := ctrl.Repo.DeleteRepository(c.Params("id"), utils.GetUserID(c), scope)
	if err != nil {
		return utils.InternalError(c, "Failed to delete feedback.", err)
	}

	ctrl.Repo.Cache.InvalidateFeedbacks(c.Context())

	return utils.OK(c, "Feedback deleted.", generic.DeleteResponse{ID: id})
}
