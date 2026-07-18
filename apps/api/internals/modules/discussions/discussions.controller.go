package discussions

import (
	"errors"

	"coursehunt/api/internals/models"
	"coursehunt/api/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (m *DiscussionsModule) ListController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	lessonID := c.Query("lessonID")
	if lessonID == "" {
		return utils.BadRequest(c, "Lesson ID query param required.", nil)
	}
	userID := utils.GetUserID(c)
	list, total, err := m.ListByLessonRepository(lessonID, userID, page, limit)
	if err != nil {
		if errors.Is(err, ErrLessonNotFound) {
			return utils.NotFound(c, "Lesson not found.", err)
		}
		if errors.Is(err, ErrNotEnrolled) {
			return utils.Forbidden(c, "Access denied. Not enrolled in course.", err)
		}
		return utils.InternalError(c, "Failed to fetch discussions.", err)
	}
	return utils.OK(c, "Discussions fetched.", models.PaginatedResponse[[]Discussion]{
		Data: list, Total: total, Page: page, Limit: limit,
	})
}

func (m *DiscussionsModule) ListRepliesController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	userID := utils.GetUserID(c)
	list, total, err := m.ListRepliesRepository(c.Params("id"), userID, page, limit)
	if err != nil {
		if errors.Is(err, ErrDiscussionNotFound) {
			return utils.NotFound(c, "Discussion not found.", err)
		}
		if errors.Is(err, ErrNotEnrolled) {
			return utils.Forbidden(c, "Access denied. Not enrolled in course.", err)
		}
		return utils.InternalError(c, "Failed to fetch replies.", err)
	}
	return utils.OK(c, "Replies fetched.", models.PaginatedResponse[[]Discussion]{
		Data: list, Total: total, Page: page, Limit: limit,
	})
}

func (m *DiscussionsModule) CreateController(c *fiber.Ctx) error {
	var req CreateDiscussionRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	userID := utils.GetUserID(c)
	d, err := m.CreateRepository(userID, req)
	if err != nil {
		if errors.Is(err, ErrLessonNotFound) {
			return utils.NotFound(c, "Lesson not found.", err)
		}
		if errors.Is(err, ErrNotEnrolled) {
			return utils.Forbidden(c, "Access denied. Not enrolled in course.", err)
		}
		if errors.Is(err, ErrParentNotFound) {
			return utils.NotFound(c, "Parent discussion not found.", err)
		}
		if errors.Is(err, ErrParentInvalid) {
			return utils.BadRequest(c, "Parent discussion belongs to a different lesson.", err)
		}
		return utils.InternalError(c, "Failed to post discussion.", err)
	}
	return utils.Created(c, "Discussion posted.", d)
}

func (m *DiscussionsModule) UpdateController(c *fiber.Ctx) error {
	var req UpdateDiscussionRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	userID := utils.GetUserID(c)
	d, err := m.UpdateRepository(c.Params("id"), userID, req.Content)
	if err != nil {
		if errors.Is(err, ErrDiscussionNotFound) {
			return utils.NotFound(c, "Discussion not found.", err)
		}
		if errors.Is(err, ErrAccessDenied) {
			return utils.Forbidden(c, "Access denied. You do not own this discussion.", err)
		}
		if errors.Is(err, ErrNotEnrolled) {
			return utils.Forbidden(c, "Access denied. Not enrolled in course.", err)
		}
		return utils.InternalError(c, "Failed to update discussion.", err)
	}
	return utils.OK(c, "Discussion updated.", d)
}

func (m *DiscussionsModule) DeleteController(c *fiber.Ctx) error {
	userID := utils.GetUserID(c)
	id, err := m.DeleteRepository(c.Params("id"), userID)
	if err != nil {
		if errors.Is(err, ErrDiscussionNotFound) {
			return utils.NotFound(c, "Discussion not found.", err)
		}
		if errors.Is(err, ErrAccessDenied) {
			return utils.Forbidden(c, "Access denied. You do not own this discussion.", err)
		}
		if errors.Is(err, ErrNotEnrolled) {
			return utils.Forbidden(c, "Access denied. Not enrolled in course.", err)
		}
		return utils.InternalError(c, "Failed to delete discussion.", err)
	}
	return utils.OK(c, "Discussion deleted.", models.DeleteResponse{ID: id})
}

func (m *DiscussionsModule) TutorDeleteController(c *fiber.Ctx) error {
	tutorID := utils.GetUserID(c)
	id, err := m.TutorDeleteRepository(c.Params("id"), tutorID)
	if err != nil {
		if errors.Is(err, ErrDiscussionNotFound) {
			return utils.NotFound(c, "Discussion not found.", err)
		}
		if errors.Is(err, ErrAccessDenied) {
			return utils.Forbidden(c, "Access denied. You are not the owner of this course.", err)
		}
		return utils.InternalError(c, "Failed to delete discussion.", err)
	}
	return utils.OK(c, "Discussion deleted.", models.DeleteResponse{ID: id})
}

func (m *DiscussionsModule) AdminListController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	list, total, err := m.AdminListRepository(page, limit)
	if err != nil {
		return utils.InternalError(c, "Failed to fetch discussions.", err)
	}
	return utils.OK(c, "Discussions fetched.", models.PaginatedResponse[[]Discussion]{
		Data: list, Total: total, Page: page, Limit: limit,
	})
}

func (m *DiscussionsModule) AdminDeleteController(c *fiber.Ctx) error {
	id, err := m.AdminDeleteRepository(c.Params("id"))
	if err != nil {
		if errors.Is(err, ErrDiscussionNotFound) {
			return utils.NotFound(c, "Discussion not found.", err)
		}
		return utils.InternalError(c, "Failed to delete discussion.", err)
	}
	return utils.OK(c, "Discussion deleted.", models.DeleteResponse{ID: id})
}
