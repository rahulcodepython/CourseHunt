package feedbacks

import (
	"errors"

	"coursehunt/api/internals/generic"
	"coursehunt/api/internals/utils"

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
			return utils.Forbidden(c, "Access denied. Not enrolled in course.", err)
		}
		return utils.InternalError(c, "Failed to post feedback.", err)
	}
	return utils.Created(c, "Feedback posted.", f)
}

func (m *FeedbacksModule) ListController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	scope := generic.ScopeFromPermission(c.Locals("permission").(string))
	list, total, err := m.ListRepository(scope, utils.GetUserID(c), page, limit,
		c.Query("is_pinned"), c.Query("user_name"), c.Query("user_email"), c.Query("course_id"))
	if err != nil {
		return utils.InternalError(c, "Failed to fetch feedbacks.", err)
	}
	return utils.OK(c, "Feedbacks fetched.", generic.PaginatedResponse[[]Feedback]{
		Data: list, Total: total, Page: page, Limit: limit,
	})
}

func (m *FeedbacksModule) ListPinnedController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	list, total, err := m.ListRepository(generic.ScopeAdmin, "", page, limit, "true", "", "", "")
	if err != nil {
		return utils.InternalError(c, "Failed to fetch pinned feedbacks.", err)
	}
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
	return utils.OK(c, "Feedback pin status updated.", f)
}

func (m *FeedbacksModule) DeleteController(c *fiber.Ctx) error {
	id, err := m.DeleteRepository(c.Params("id"))
	if err != nil {
		return utils.InternalError(c, "Failed to delete feedback.", err)
	}
	return utils.OK(c, "Feedback deleted.", generic.DeleteResponse{ID: id})
}
