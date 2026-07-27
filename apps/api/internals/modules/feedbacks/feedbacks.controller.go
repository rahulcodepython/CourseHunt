package feedbacks

import (
	"errors"
	"fmt"
	"time"

	"coursehunt/api/internals/generic"
	"coursehunt/api/internals/utils"

	"github.com/gofiber/fiber/v2"
)

type feedbacksListCacheData struct {
	Data  []Feedback `json:"data"`
	Total int        `json:"total"`
}

func (m *FeedbacksModule) CreateController(c *fiber.Ctx) error {
	var req CreateFeedbackRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	userID := utils.GetUserID(c)
	f, err := m.CreateRepository(userID, req.CourseID, req)
	if err != nil {
		if errors.Is(err, ErrNotEnrolled) {
			return utils.Forbidden(c, "Access denied. Not enrolled in course.", err)
		}
		return utils.InternalError(c, "Failed to post feedback.", err)
	}

	m.Cache.InvalidateFeedbacks(c.Context())

	return utils.Created(c, "Feedback posted.", f)
}

func (m *FeedbacksModule) ListController(c *fiber.Ctx) error {
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
	if hit, _ := m.Cache.Get(c.Context(), cacheKey, &cached); hit {
		return utils.OK(c, "Feedbacks fetched.", generic.PaginatedResponse[[]Feedback]{
			Data: cached.Data, Total: cached.Total, Page: page, Limit: limit,
		})
	}

	list, total, err := m.ListRepository(scope, userID, page, limit, isPinned, userName, userEmail, courseID)
	if err != nil {
		return utils.InternalError(c, "Failed to fetch feedbacks.", err)
	}

	_ = m.Cache.Set(c.Context(), cacheKey, feedbacksListCacheData{Data: list, Total: total}, 5*time.Minute)

	return utils.OK(c, "Feedbacks fetched.", generic.PaginatedResponse[[]Feedback]{
		Data: list, Total: total, Page: page, Limit: limit,
	})
}

func (m *FeedbacksModule) ListPinnedController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	cacheKey := fmt.Sprintf("feedbacks:pinned:p:%d:l:%d", page, limit)

	var cached feedbacksListCacheData
	if hit, _ := m.Cache.Get(c.Context(), cacheKey, &cached); hit {
		return utils.OK(c, "Pinned feedbacks fetched.", generic.PaginatedResponse[[]Feedback]{
			Data: cached.Data, Total: cached.Total, Page: page, Limit: limit,
		})
	}

	list, total, err := m.ListRepository(generic.ScopeAdmin, "", page, limit, "true", "", "", "")
	if err != nil {
		return utils.InternalError(c, "Failed to fetch pinned feedbacks.", err)
	}

	_ = m.Cache.Set(c.Context(), cacheKey, feedbacksListCacheData{Data: list, Total: total}, 10*time.Minute)

	return utils.OK(c, "Pinned feedbacks fetched.", generic.PaginatedResponse[[]Feedback]{
		Data: list, Total: total, Page: page, Limit: limit,
	})
}

func (m *FeedbacksModule) UpdateController(c *fiber.Ctx) error {
	var req PinFeedbackRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.BadRequest(c, "Invalid request body.", err)
	}
	f, err := m.UpdateRepository(c.Params("id"), req.IsPinned)
	if err != nil {
		if errors.Is(err, ErrFeedbackNotFound) {
			return utils.NotFound(c, "Feedback not found.", err)
		}
		return utils.InternalError(c, "Failed to update feedback pin status.", err)
	}

	m.Cache.InvalidateFeedbacks(c.Context())

	return utils.OK(c, "Feedback pin status updated.", f)
}

func (m *FeedbacksModule) DeleteController(c *fiber.Ctx) error {
	perm, _ := c.Locals("permission").(string)
	scope := generic.ScopeFromPermission(perm)
	id, err := m.DeleteRepository(c.Params("id"), utils.GetUserID(c), scope)
	if err != nil {
		return utils.InternalError(c, "Failed to delete feedback.", err)
	}

	m.Cache.InvalidateFeedbacks(c.Context())

	return utils.OK(c, "Feedback deleted.", generic.DeleteResponse{ID: id})
}
