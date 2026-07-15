package courses

import (
	"errors"

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
		return utils.InternalError(c, "Failed to fetch public courses.", err)
	}
	return utils.OK(c, "Public courses fetched successfully.", models.PaginatedResponse[[]CoursePublicResponse]{
		Data: cards, Total: total, Page: page, Limit: limit,
	})
}

func (m *CoursesModule) PublicSingleController(c *fiber.Ctx) error {
	resp, err := m.PublicSingleRepository(c.Params("slug"), utils.GetUserID(c))
	if err != nil {
		if errors.Is(err, ErrCourseNotFound) {
			return utils.NotFound(c, "Course not found.", err)
		}
		return utils.InternalError(c, "Failed to fetch course details.", err)
	}
	return utils.OK(c, "Course details fetched successfully.", resp)
}

func (m *CoursesModule) StudyController(c *fiber.Ctx) error {
	userID := utils.GetUserID(c)
	resp, err := m.StudyMetadataRepository(c.Params("id"), userID)
	if err != nil {
		if errors.Is(err, ErrCourseNotFound) {
			return utils.NotFound(c, "Course not found.", err)
		}
		if errors.Is(err, ErrNotEnrolled) {
			return utils.Forbidden(c, "Access denied. Not enrolled in this course.", err)
		}
		return utils.InternalError(c, "Failed to fetch study page.", err)
	}
	return utils.OK(c, "Study page fetched successfully.", resp)
}

func (m *CoursesModule) EnrolledListController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	list, total, err := m.EnrolledCoursesRepository(utils.GetUserID(c), page, limit)
	if err != nil {
		return utils.InternalError(c, "Failed to fetch enrolled courses.", err)
	}
	return utils.OK(c, "Enrolled courses fetched successfully.", models.PaginatedResponse[[]EnrolledCourseResponse]{
		Data: list, Total: total, Page: page, Limit: limit,
	})
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
		return utils.InternalError(c, "Failed to inspect courses.", err)
	}
	return utils.OK(c, "Courses inspected successfully.", models.PaginatedResponse[[]CourseInspectResponse]{
		Data: list, Total: total, Page: page, Limit: limit,
	})
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
		return utils.InternalError(c, "Failed to fetch your courses.", err)
	}
	return utils.OK(c, "Your courses fetched successfully.", models.PaginatedResponse[[]CourseInspectResponse]{
		Data: list, Total: total, Page: page, Limit: limit,
	})
}

func (m *CoursesModule) CreateController(c *fiber.Ctx) error {
	var req CreateCourseRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	resp, err := m.CreateRepository(utils.GetUserID(c), req)
	if err != nil {
		return utils.InternalError(c, "Failed to create course.", err)
	}
	return utils.Created(c, "Course created successfully.", resp)
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
			return utils.NotFound(c, "Course not found.", err)
		}
		if errors.Is(err, ErrAccessDenied) {
			return utils.Forbidden(c, "Access denied. You do not own this course.", err)
		}
		return utils.InternalError(c, "Failed to update course.", err)
	}
	return utils.OK(c, "Course updated successfully.", course)
}

func (m *CoursesModule) DeleteController(c *fiber.Ctx) error {
	userID := utils.GetUserID(c)
	id, err := m.DeleteRepository(c.Params("id"), userID)
	if err != nil {
		if errors.Is(err, ErrCourseNotFound) {
			return utils.NotFound(c, "Course not found.", err)
		}
		if errors.Is(err, ErrAccessDenied) {
			return utils.Forbidden(c, "Access denied. You do not own this course.", err)
		}
		return utils.InternalError(c, "Failed to delete course.", err)
	}
	return utils.OK(c, "Course deleted successfully.", models.DeleteResponse{ID: id})
}
