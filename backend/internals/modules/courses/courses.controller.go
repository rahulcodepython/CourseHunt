package courses

import (
	"errors"
	"net/http"

	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (m *CoursesModule) PublicListController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	cards, total, err := m.PublicListRepository(page, limit,
		c.Query("category_id"),
		c.Query("subcategory_id"),
		c.Query("level"),
		c.Query("search"),
	)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "Failed to fetch public courses.", nil, nil)
	}
	return utils.JSON(c, http.StatusOK, true, "Public courses fetched successfully.", models.PaginatedResponse[[]CoursePublicResponse]{
		Data: cards, Total: total, Page: page, Limit: limit,
	}, nil)
}

func (m *CoursesModule) PublicSingleController(c *fiber.Ctx) error {
	resp, err := m.PublicSingleRepository(c.Params("slug"), utils.GetUserID(c))
	if err != nil {
		if errors.Is(err, ErrCourseNotFound) {
			return utils.JSON(c, http.StatusNotFound, false, "Course not found.", nil, err.Error())
		}
		return utils.JSON(c, http.StatusInternalServerError, false, "Failed to fetch course details.", nil, nil)
	}
	return utils.JSON(c, http.StatusOK, true, "Course details fetched successfully.", resp, nil)
}

func (m *CoursesModule) StudyController(c *fiber.Ctx) error {
	userID := utils.GetUserID(c)
	resp, err := m.StudyMetadataRepository(c.Params("id"), userID)
	if err != nil {
		if errors.Is(err, ErrCourseNotFound) {
			return utils.JSON(c, http.StatusNotFound, false, "Course not found.", nil, err.Error())
		}
		if errors.Is(err, ErrNotEnrolled) {
			return utils.JSON(c, http.StatusForbidden, false, "Access denied. Not enrolled in this course.", nil, err.Error())
		}
		return utils.JSON(c, http.StatusInternalServerError, false, "Failed to fetch study page.", nil, nil)
	}
	return utils.JSON(c, http.StatusOK, true, "Study page fetched successfully.", resp, nil)
}

func (m *CoursesModule) EnrolledListController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	list, total, err := m.EnrolledCoursesRepository(utils.GetUserID(c), page, limit)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "Failed to fetch enrolled courses.", nil, nil)
	}
	return utils.JSON(c, http.StatusOK, true, "Enrolled courses fetched successfully.", models.PaginatedResponse[[]EnrolledCourseResponse]{
		Data: list, Total: total, Page: page, Limit: limit,
	}, nil)
}

func (m *CoursesModule) InspectController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	list, total, err := m.InspectRepository(page, limit,
		c.Query("category_id"),
		c.Query("subcategory_id"),
		c.Query("level"),
		c.Query("search"),
		c.Query("tutor_id"),
		c.Query("status"),
	)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "Failed to inspect courses.", nil, nil)
	}
	return utils.JSON(c, http.StatusOK, true, "Courses inspected successfully.", models.PaginatedResponse[[]CourseInspectResponse]{
		Data: list, Total: total, Page: page, Limit: limit,
	}, nil)
}

func (m *CoursesModule) ListController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	userID := utils.GetUserID(c)
	list, total, err := m.TutorListRepository(page, limit,
		userID,
		c.Query("category_id"),
		c.Query("subcategory_id"),
		c.Query("level"),
		c.Query("search"),
		c.Query("status"),
	)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "Failed to fetch your courses.", nil, nil)
	}
	return utils.JSON(c, http.StatusOK, true, "Your courses fetched successfully.", models.PaginatedResponse[[]CourseInspectResponse]{
		Data: list, Total: total, Page: page, Limit: limit,
	}, nil)
}

func (m *CoursesModule) CreateController(c *fiber.Ctx) error {
	var req CreateCourseRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	resp, err := m.CreateRepository(utils.GetUserID(c), req)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "Failed to create course.", nil, nil)
	}
	return utils.JSON(c, http.StatusCreated, true, "Course created successfully.", resp, nil)
}

func (m *CoursesModule) UpdateController(c *fiber.Ctx) error {
	var req UpdateCourseRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	userID := utils.GetUserID(c)
	course, err := m.UpdateRepository(c.Params("id"), userID, req)
	if err != nil {
		if errors.Is(err, ErrCourseNotFound) {
			return utils.JSON(c, http.StatusNotFound, false, "Course not found.", nil, err.Error())
		}
		if errors.Is(err, ErrAccessDenied) {
			return utils.JSON(c, http.StatusForbidden, false, "Access denied. You do not own this course.", nil, err.Error())
		}
		return utils.JSON(c, http.StatusInternalServerError, false, "Failed to update course.", nil, nil)
	}
	return utils.JSON(c, http.StatusOK, true, "Course updated successfully.", course, nil)
}

func (m *CoursesModule) DeleteController(c *fiber.Ctx) error {
	userID := utils.GetUserID(c)
	id, err := m.DeleteRepository(c.Params("id"), userID)
	if err != nil {
		if errors.Is(err, ErrCourseNotFound) {
			return utils.JSON(c, http.StatusNotFound, false, "Course not found.", nil, err.Error())
		}
		if errors.Is(err, ErrAccessDenied) {
			return utils.JSON(c, http.StatusForbidden, false, "Access denied. You do not own this course.", nil, err.Error())
		}
		return utils.JSON(c, http.StatusInternalServerError, false, "Failed to delete course.", nil, nil)
	}
	return utils.JSON(c, http.StatusOK, true, "Course deleted successfully.", map[string]string{"id": id}, nil)
}
