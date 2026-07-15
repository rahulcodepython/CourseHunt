package discussions

import (
	"errors"
	"net/http"

	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (m *DiscussionsModule) ListController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	lessonID := c.Query("lessonID")
	if lessonID == "" {
		return utils.JSON(c, http.StatusBadRequest, false, "Lesson ID query param required.", nil, nil)
	}
	userID := utils.GetUserID(c)
	list, total, err := m.ListByLessonRepository(lessonID, userID, page, limit)
	if err != nil {
		if errors.Is(err, ErrLessonNotFound) {
			return utils.JSON(c, http.StatusNotFound, false, "Lesson not found.", nil, err.Error())
		}
		if errors.Is(err, ErrNotEnrolled) {
			return utils.JSON(c, http.StatusForbidden, false, "Access denied. Not enrolled in course.", nil, err.Error())
		}
		return utils.JSON(c, http.StatusInternalServerError, false, "Failed to fetch discussions.", nil, nil)
	}
	return utils.JSON(c, http.StatusOK, true, "Discussions fetched.", models.PaginatedResponse[[]Discussion]{
		Data: list, Total: total, Page: page, Limit: limit,
	}, nil)
}

func (m *DiscussionsModule) ListRepliesController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	userID := utils.GetUserID(c)
	list, total, err := m.ListRepliesRepository(c.Params("id"), userID, page, limit)
	if err != nil {
		if errors.Is(err, ErrDiscussionNotFound) {
			return utils.JSON(c, http.StatusNotFound, false, "Discussion not found.", nil, err.Error())
		}
		if errors.Is(err, ErrNotEnrolled) {
			return utils.JSON(c, http.StatusForbidden, false, "Access denied. Not enrolled in course.", nil, err.Error())
		}
		return utils.JSON(c, http.StatusInternalServerError, false, "Failed to fetch replies.", nil, nil)
	}
	return utils.JSON(c, http.StatusOK, true, "Replies fetched.", models.PaginatedResponse[[]Discussion]{
		Data: list, Total: total, Page: page, Limit: limit,
	}, nil)
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
			return utils.JSON(c, http.StatusNotFound, false, "Lesson not found.", nil, err.Error())
		}
		if errors.Is(err, ErrNotEnrolled) {
			return utils.JSON(c, http.StatusForbidden, false, "Access denied. Not enrolled in course.", nil, err.Error())
		}
		if errors.Is(err, ErrParentNotFound) {
			return utils.JSON(c, http.StatusNotFound, false, "Parent discussion not found.", nil, err.Error())
		}
		if errors.Is(err, ErrParentInvalid) {
			return utils.JSON(c, http.StatusBadRequest, false, "Parent discussion belongs to a different lesson.", nil, err.Error())
		}
		return utils.JSON(c, http.StatusInternalServerError, false, "Failed to post discussion.", nil, nil)
	}
	return utils.JSON(c, http.StatusCreated, true, "Discussion posted.", d, nil)
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
			return utils.JSON(c, http.StatusNotFound, false, "Discussion not found.", nil, err.Error())
		}
		if errors.Is(err, ErrAccessDenied) {
			return utils.JSON(c, http.StatusForbidden, false, "Access denied. You do not own this discussion.", nil, err.Error())
		}
		if errors.Is(err, ErrNotEnrolled) {
			return utils.JSON(c, http.StatusForbidden, false, "Access denied. Not enrolled in course.", nil, err.Error())
		}
		return utils.JSON(c, http.StatusInternalServerError, false, "Failed to update discussion.", nil, nil)
	}
	return utils.JSON(c, http.StatusOK, true, "Discussion updated.", d, nil)
}

func (m *DiscussionsModule) DeleteController(c *fiber.Ctx) error {
	userID := utils.GetUserID(c)
	id, err := m.DeleteRepository(c.Params("id"), userID)
	if err != nil {
		if errors.Is(err, ErrDiscussionNotFound) {
			return utils.JSON(c, http.StatusNotFound, false, "Discussion not found.", nil, err.Error())
		}
		if errors.Is(err, ErrAccessDenied) {
			return utils.JSON(c, http.StatusForbidden, false, "Access denied. You do not own this discussion.", nil, err.Error())
		}
		if errors.Is(err, ErrNotEnrolled) {
			return utils.JSON(c, http.StatusForbidden, false, "Access denied. Not enrolled in course.", nil, err.Error())
		}
		return utils.JSON(c, http.StatusInternalServerError, false, "Failed to delete discussion.", nil, nil)
	}
	return utils.JSON(c, http.StatusOK, true, "Discussion deleted.", map[string]string{"id": id}, nil)
}

func (m *DiscussionsModule) TutorDeleteController(c *fiber.Ctx) error {
	tutorID := utils.GetUserID(c)
	id, err := m.TutorDeleteRepository(c.Params("id"), tutorID)
	if err != nil {
		if errors.Is(err, ErrDiscussionNotFound) {
			return utils.JSON(c, http.StatusNotFound, false, "Discussion not found.", nil, err.Error())
		}
		if errors.Is(err, ErrAccessDenied) {
			return utils.JSON(c, http.StatusForbidden, false, "Access denied. You are not the owner of this course.", nil, err.Error())
		}
		return utils.JSON(c, http.StatusInternalServerError, false, "Failed to delete discussion.", nil, nil)
	}
	return utils.JSON(c, http.StatusOK, true, "Discussion deleted.", map[string]string{"id": id}, nil)
}

func (m *DiscussionsModule) AdminListController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	list, total, err := m.AdminListRepository(page, limit)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "Failed to fetch discussions.", nil, nil)
	}
	return utils.JSON(c, http.StatusOK, true, "Discussions fetched.", models.PaginatedResponse[[]Discussion]{
		Data: list, Total: total, Page: page, Limit: limit,
	}, nil)
}

func (m *DiscussionsModule) AdminDeleteController(c *fiber.Ctx) error {
	id, err := m.AdminDeleteRepository(c.Params("id"))
	if err != nil {
		if errors.Is(err, ErrDiscussionNotFound) {
			return utils.JSON(c, http.StatusNotFound, false, "Discussion not found.", nil, err.Error())
		}
		return utils.JSON(c, http.StatusInternalServerError, false, "Failed to delete discussion.", nil, nil)
	}
	return utils.JSON(c, http.StatusOK, true, "Discussion deleted.", map[string]string{"id": id}, nil)
}
