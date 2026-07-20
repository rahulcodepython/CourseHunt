package discussions

import (
	"errors"

	"coursehunt/api/internals/models"
	"coursehunt/api/internals/utils"

	"github.com/gofiber/fiber/v2"
)

// --- Student Controllers ---

func (m *DiscussionsModule) StudentListController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	lessonID := c.Params("lessonId")
	userID := utils.GetUserID(c)

	if lessonID == "" {
		return utils.BadRequest(c, "Lesson ID required.", nil)
	}

	list, total, err := m.StudentListRepository(lessonID, "", userID, page, limit)
	if err != nil {
		if errors.Is(err, ErrMissingTarget) {
			return utils.BadRequest(c, "Lesson ID query param required.", err)
		}
		if errors.Is(err, ErrTargetNotFound) {
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

func (m *DiscussionsModule) StudentListRepliesController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	parentID := c.Params("id")
	userID := utils.GetUserID(c)

	list, total, err := m.StudentListRepository("", parentID, userID, page, limit)
	if err != nil {
		if errors.Is(err, ErrMissingTarget) {
			return utils.BadRequest(c, "Discussion ID required.", err)
		}
		if errors.Is(err, ErrTargetNotFound) {
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

func (m *DiscussionsModule) StudentCreateController(c *fiber.Ctx) error {
	var req CreateDiscussionRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	userID := utils.GetUserID(c)
	d, err := m.StudentCreateRepository(userID, req)
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

func (m *DiscussionsModule) StudentUpdateController(c *fiber.Ctx) error {
	var req UpdateDiscussionRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	userID := utils.GetUserID(c)
	d, err := m.StudentUpdateRepository(c.Params("id"), userID, req.Content)
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

func (m *DiscussionsModule) StudentDeleteController(c *fiber.Ctx) error {
	userID := utils.GetUserID(c)
	id, err := m.StudentDeleteRepository(c.Params("id"), userID)
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

// --- Tutor Controllers ---

func (m *DiscussionsModule) TutorListController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	lessonID := c.Params("lessonId")
	tutorID := utils.GetUserID(c)

	if lessonID == "" {
		return utils.BadRequest(c, "Lesson ID required.", nil)
	}

	list, total, err := m.TutorListRepository(lessonID, "", tutorID, page, limit)
	if err != nil {
		if errors.Is(err, ErrMissingTarget) {
			return utils.BadRequest(c, "Lesson ID query param required.", err)
		}
		if errors.Is(err, ErrTargetNotFound) {
			return utils.NotFound(c, "Lesson not found.", err)
		}
		if errors.Is(err, ErrAccessDenied) {
			return utils.Forbidden(c, "Access denied. You do not own this course.", err)
		}
		return utils.InternalError(c, "Failed to fetch discussions.", err)
	}
	return utils.OK(c, "Discussions fetched.", models.PaginatedResponse[[]Discussion]{
		Data: list, Total: total, Page: page, Limit: limit,
	})
}

func (m *DiscussionsModule) TutorListRepliesController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	parentID := c.Params("id")
	tutorID := utils.GetUserID(c)

	list, total, err := m.TutorListRepository("", parentID, tutorID, page, limit)
	if err != nil {
		if errors.Is(err, ErrMissingTarget) {
			return utils.BadRequest(c, "Discussion ID required.", err)
		}
		if errors.Is(err, ErrTargetNotFound) {
			return utils.NotFound(c, "Discussion not found.", err)
		}
		if errors.Is(err, ErrAccessDenied) {
			return utils.Forbidden(c, "Access denied. You do not own this course.", err)
		}
		return utils.InternalError(c, "Failed to fetch replies.", err)
	}
	return utils.OK(c, "Replies fetched.", models.PaginatedResponse[[]Discussion]{
		Data: list, Total: total, Page: page, Limit: limit,
	})
}

func (m *DiscussionsModule) TutorCreateController(c *fiber.Ctx) error {
	var req CreateDiscussionRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	tutorID := utils.GetUserID(c)
	d, err := m.TutorCreateRepository(tutorID, req)
	if err != nil {
		if errors.Is(err, ErrLessonNotFound) {
			return utils.NotFound(c, "Lesson not found.", err)
		}
		if errors.Is(err, ErrAccessDenied) {
			return utils.Forbidden(c, "Access denied. You do not own this course.", err)
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

func (m *DiscussionsModule) TutorUpdateController(c *fiber.Ctx) error {
	var req UpdateDiscussionRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	tutorID := utils.GetUserID(c)
	d, err := m.TutorUpdateRepository(c.Params("id"), tutorID, req.Content)
	if err != nil {
		if errors.Is(err, ErrDiscussionNotFound) {
			return utils.NotFound(c, "Discussion not found.", err)
		}
		if errors.Is(err, ErrAccessDenied) {
			return utils.Forbidden(c, "Access denied.", err)
		}
		return utils.InternalError(c, "Failed to update discussion.", err)
	}
	return utils.OK(c, "Discussion updated.", d)
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

// --- Admin Controllers ---

func (m *DiscussionsModule) AdminListController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	lessonID := c.Params("lessonId")

	if lessonID == "" {
		return utils.BadRequest(c, "Lesson ID required.", nil)
	}

	list, total, err := m.AdminListRepository(lessonID, "", page, limit)
	if err != nil {
		if errors.Is(err, ErrMissingTarget) {
			return utils.BadRequest(c, "Lesson ID query param required.", err)
		}
		if errors.Is(err, ErrTargetNotFound) {
			return utils.NotFound(c, "Lesson not found.", err)
		}
		return utils.InternalError(c, "Failed to fetch discussions.", err)
	}
	return utils.OK(c, "Discussions fetched.", models.PaginatedResponse[[]Discussion]{
		Data: list, Total: total, Page: page, Limit: limit,
	})
}

func (m *DiscussionsModule) AdminListRepliesController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	parentID := c.Params("id")

	list, total, err := m.AdminListRepository("", parentID, page, limit)
	if err != nil {
		if errors.Is(err, ErrMissingTarget) {
			return utils.BadRequest(c, "Discussion ID required.", err)
		}
		if errors.Is(err, ErrTargetNotFound) {
			return utils.NotFound(c, "Discussion not found.", err)
		}
		return utils.InternalError(c, "Failed to fetch replies.", err)
	}
	return utils.OK(c, "Replies fetched.", models.PaginatedResponse[[]Discussion]{
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
