package courses

import (
	"net/http"

	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/utils"

	"github.com/gofiber/fiber/v2"
)

// GET /api/courses?page=1&limit=20&category=&level=&search=
func (m *CoursesModule) ListController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	cards, total, err := m.ListService(page, limit,
		c.Query("category"),
		c.Query("level"),
		c.Query("search"),
		c.Query("tutor"),
		c.Query("status"),
	)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to fetch courses", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "courses fetched successfully", models.PaginatedResponse{
		Data: cards, Total: total, Page: page, Limit: limit,
	}, nil)
}

// POST /api/courses
func (m *CoursesModule) CreateController(c *fiber.Ctx) error {
	var req CreateCourseRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	resp, err := m.CreateService(utils.GetUserID(c), req)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to create course", nil, err.Error())
	}
	return utils.JSON(c, http.StatusCreated, true, "course created successfully", resp, nil)
}

// GET /api/courses/:slug — public landing page
func (m *CoursesModule) ReadLandingController(c *fiber.Ctx) error {
	resp, err := m.ReadLandingService(c.Params("slug"), utils.GetUserID(c))
	if err != nil {
		if err.Error() == "not found" {
			return utils.JSON(c, http.StatusNotFound, false, "course not found", nil, nil)
		}
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to fetch course", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "course fetched successfully", resp, nil)
}

// PATCH /api/courses/:id
func (m *CoursesModule) UpdateController(c *fiber.Ctx) error {
	var req UpdateCourseRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	course, err := m.UpdateService(c.Params("id"), req)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to update course", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "course updated successfully", course, nil)
}

// DELETE /api/courses/:id
func (m *CoursesModule) DeleteController(c *fiber.Ctx) error {
	id, err := m.DeleteService(c.Params("id"))
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to delete course", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "course deleted successfully", map[string]string{"id": id}, nil)
}

// GET /api/courses/:id/study
func (m *CoursesModule) ReadStudyController(c *fiber.Ctx) error {
	resp, err := m.ReadStudyService(c.Params("id"), utils.GetUserID(c))
	if err != nil {
		if err.Error() == "not enrolled" {
			return utils.JSON(c, http.StatusForbidden, false, "not enrolled in this course", nil, nil)
		}
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to fetch study page", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "study page fetched successfully", resp, nil)
}

// GET /api/courses/enrolled — enrolled courses
func (m *CoursesModule) EnrolledController(c *fiber.Ctx) error {
	list, err := m.EnrolledCoursesService(utils.GetUserID(c))
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to fetch enrolled courses", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "enrolled courses fetched successfully", list, nil)
}
