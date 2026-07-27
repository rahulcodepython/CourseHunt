package courses

import (
	"errors"
	"fmt"
	"time"

	"coursehunt/api/internals/generic"
	"coursehunt/api/internals/utils"

	"github.com/gofiber/fiber/v2"
)

type publicCoursesCacheData struct {
	Cards []CoursePublicResponse `json:"cards"`
	Total int                    `json:"total"`
}

func (m *CoursesModule) PublicListController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	catID := c.Query("category_id")
	subID := c.Query("subcategory_id")
	lvl := c.Query("level")
	search := c.Query("search")

	cacheKey := fmt.Sprintf("courses:public:list:p:%d:l:%d:c:%s:s:%s:lvl:%s:q:%s", page, limit, catID, subID, lvl, search)

	var cached publicCoursesCacheData
	if hit, _ := m.Cache.Get(c.Context(), cacheKey, &cached); hit {
		return utils.OK(c, "Public courses fetched successfully.", generic.PaginatedResponse[[]CoursePublicResponse]{
			Data: cached.Cards, Total: cached.Total, Page: page, Limit: limit,
		})
	}

	cards, total, err := m.PublicListRepository(page, limit, catID, subID, lvl, search)
	if err != nil {
		return utils.InternalError(c, "Failed to fetch public courses.", err)
	}

	_ = m.Cache.Set(c.Context(), cacheKey, publicCoursesCacheData{Cards: cards, Total: total}, 5*time.Minute)

	return utils.OK(c, "Public courses fetched successfully.", generic.PaginatedResponse[[]CoursePublicResponse]{
		Data: cards, Total: total, Page: page, Limit: limit,
	})
}

func (m *CoursesModule) PublicSingleController(c *fiber.Ctx) error {
	slug := c.Params("slug")
	userID := utils.GetUserID(c)
	cacheKey := fmt.Sprintf("courses:public:single:slug:%s:u:%s", slug, userID)

	var cached CourseLandingResponse
	if hit, _ := m.Cache.Get(c.Context(), cacheKey, &cached); hit {
		return utils.OK(c, "Course details fetched successfully.", cached)
	}

	resp, err := m.PublicSingleRepository(slug, userID)
	if err != nil {
		if errors.Is(err, ErrCourseNotFound) {
			return utils.NotFound(c, "Course not found.", err)
		}
		return utils.InternalError(c, "Failed to fetch course details.", err)
	}

	_ = m.Cache.Set(c.Context(), cacheKey, resp, 5*time.Minute)

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
	return utils.OK(c, "Enrolled courses fetched successfully.", generic.PaginatedResponse[[]EnrolledCourseResponse]{
		Data: list, Total: total, Page: page, Limit: limit,
	})
}

func (m *CoursesModule) ManageListController(c *fiber.Ctx) error {
	scope := m.resolveScope(c)
	page, limit := utils.PaginationParams(c)
	userID := utils.GetUserID(c)

	list, total, err := m.ListRepository(page, limit,
		userID, scope,
		c.Query("category_id"),
		c.Query("subcategory_id"),
		c.Query("level"),
		c.Query("search"),
		c.Query("status"),
		c.Query("tutor_id"),
	)
	if err != nil {
		return utils.InternalError(c, "Failed to fetch courses.", err)
	}
	return utils.OK(c, "Courses fetched successfully.", generic.PaginatedResponse[[]Course]{
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

	m.Cache.InvalidateCourses(c.Context())

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

	m.Cache.InvalidateCourses(c.Context())

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

	m.Cache.InvalidateCourses(c.Context())

	return utils.OK(c, "Course deleted successfully.", generic.DeleteResponse{ID: id})
}
