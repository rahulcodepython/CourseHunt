package courses

import (
	"errors"
	"net/http"

	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/utils"

	"github.com/gofiber/fiber/v2"
)

// @Summary PublicListController
// @Description Fetch public courses for landing page
// @Tags Courses
// @Accept json
// @Produce json
// @Success 200 {object} utils.PaginatedResponse[CourseCardResponse]
// @Router /api/v1/courses [get]
func (m *CoursesModule) PublicListController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	cards, total, err := m.PublicListRepository(page, limit,
		c.Query("category_id"),
		c.Query("subcategory_id"),
		c.Query("level"),
		c.Query("search"),
	)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to fetch public courses", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "public courses fetched successfully", models.PaginatedResponse[[]CoursePublicResponse]{
		Data: cards, Total: total, Page: page, Limit: limit,
	}, nil)
}

// @Summary PublicSingleController
// @Description Fetch single course details for landing page
// @Tags Courses
// @Accept json
// @Produce json
// @Param slug path string true "slug"
// @Success 200 {object} utils.SwaggerResponse[CourseLandingResponse]
// @Router /api/v1/courses/{slug} [get]
func (m *CoursesModule) PublicSingleController(c *fiber.Ctx) error {
	resp, err := m.PublicSingleRepository(c.Params("slug"), utils.GetUserID(c))
	if err != nil {
		switch {
		case errors.Is(err, ErrCourseNotFound):
			return utils.JSON(c, http.StatusNotFound, false, "course not found", nil, nil)
		default:
			return utils.JSON(c, http.StatusInternalServerError, false, "failed to fetch course landing page", nil, err.Error())
		}
	}
	return utils.JSON(c, http.StatusOK, true, "course landing page fetched successfully", resp, nil)
}

// @Summary StudyController
// @Description Fetch study materials for enrolled users
// @Tags Courses
// @Accept json
// @Produce json
// @Param id path string true "id"
// @Success 200 {object} utils.SwaggerResponse[CourseStudyResponse]
// @Router /api/v1/courses/{id}/study [get]
func (m *CoursesModule) StudyController(c *fiber.Ctx) error {
	userID := utils.GetUserID(c)
	resp, err := m.StudyMetadataRepository(c.Params("id"), userID)
	if err != nil {
		switch {
		case errors.Is(err, ErrCourseNotFound):
			return utils.JSON(c, http.StatusNotFound, false, "course not found", nil, nil)
		case errors.Is(err, ErrNotEnrolled):
			return utils.JSON(c, http.StatusForbidden, false, "not enrolled in this course", nil, nil)
		default:
			return utils.JSON(c, http.StatusInternalServerError, false, "failed to fetch study page", nil, err.Error())
		}
	}
	return utils.JSON(c, http.StatusOK, true, "study page fetched successfully", resp, nil)
}

// @Summary EnrolledListController
// @Description Fetch enrolled courses for the logged-in user
// @Tags Courses
// @Accept json
// @Produce json
// @Success 200 {object} utils.SwaggerResponse[[]EnrolledCourseResponse]
// @Router /api/v1/me/enrolled [get]
func (m *CoursesModule) EnrolledListController(c *fiber.Ctx) error {
	list, err := m.EnrolledCoursesRepository(utils.GetUserID(c))
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to fetch enrolled courses", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "enrolled courses fetched successfully", list, nil)
}

// @Summary InspectController
// @Description Admin inspect courses metadata
// @Tags Courses
// @Accept json
// @Produce json
// @Success 200 {object} utils.PaginatedResponse[CourseInspectResponse]
// @Router /api/v1/courses/inspect [get]
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
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to inspect courses", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "courses inspected successfully", models.PaginatedResponse[[]CourseInspectResponse]{
		Data: list, Total: total, Page: page, Limit: limit,
	}, nil)
}

// @Summary ListController
// @Description Tutors retrieve their own courses
// @Tags Courses
// @Accept json
// @Produce json
// @Success 200 {object} utils.PaginatedResponse[CourseInspectResponse]
// @Router /api/v1/courses [get]
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
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to fetch tutor courses", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "tutor courses fetched successfully", models.PaginatedResponse[[]CourseInspectResponse]{
		Data: list, Total: total, Page: page, Limit: limit,
	}, nil)
}

// @Summary CreateController
// @Description Create a new course
// @Tags Courses
// @Accept json
// @Produce json
// @Param body body courses.CreateCourseRequest true "Request Body"
// @Success 201 {object} utils.SwaggerResponse[CourseCreatedResponse]
// @Router /api/v1/courses [post]
func (m *CoursesModule) CreateController(c *fiber.Ctx) error {
	var req CreateCourseRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	resp, err := m.CreateRepository(utils.GetUserID(c), req)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to create course", nil, err.Error())
	}
	return utils.JSON(c, http.StatusCreated, true, "course created successfully", resp, nil)
}

// @Summary UpdateController
// @Description Update course details
// @Tags Courses
// @Accept json
// @Produce json
// @Param id path string true "id"
// @Param body body courses.UpdateCourseRequest true "Request Body"
// @Success 200 {object} utils.SwaggerResponse[Course]
// @Router /api/v1/courses/{id} [patch]
func (m *CoursesModule) UpdateController(c *fiber.Ctx) error {
	var req UpdateCourseRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	userID := utils.GetUserID(c)
	course, err := m.UpdateRepository(c.Params("id"), userID, req)
	if err != nil {
		switch {
		case errors.Is(err, ErrCourseNotFound):
			return utils.JSON(c, http.StatusNotFound, false, "course not found", nil, nil)
		case errors.Is(err, ErrAccessDenied):
			return utils.JSON(c, http.StatusForbidden, false, "access denied: you do not own this course", nil, nil)
		default:
			return utils.JSON(c, http.StatusInternalServerError, false, "failed to update course", nil, err.Error())
		}
	}
	return utils.JSON(c, http.StatusOK, true, "course updated successfully", course, nil)
}

// @Summary DeleteController
// @Description Delete a course
// @Tags Courses
// @Accept json
// @Produce json
// @Param id path string true "id"
// @Success 200 {object} utils.SwaggerResponse[utils.DeleteResponse]
// @Router /api/v1/courses/{id} [delete]
func (m *CoursesModule) DeleteController(c *fiber.Ctx) error {
	userID := utils.GetUserID(c)
	id, err := m.DeleteRepository(c.Params("id"), userID)
	if err != nil {
		switch {
		case errors.Is(err, ErrCourseNotFound):
			return utils.JSON(c, http.StatusNotFound, false, "course not found", nil, nil)
		case errors.Is(err, ErrAccessDenied):
			return utils.JSON(c, http.StatusForbidden, false, "access denied: you do not own this course", nil, nil)
		default:
			return utils.JSON(c, http.StatusInternalServerError, false, "failed to delete course", nil, err.Error())
		}
	}
	return utils.JSON(c, http.StatusOK, true, "course deleted successfully", map[string]string{"id": id}, nil)
}
