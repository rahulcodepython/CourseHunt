package handlers

import (
	"net/http"
	"strconv"

	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/services"
	"coursehunt-backend/internals/utils"

	"github.com/gofiber/fiber/v2"
)

type CourseHandler struct{ Svc *services.CourseService }

func NewCourseHandler() *CourseHandler { return &CourseHandler{Svc: services.NewCourseService()} }

func getUserID(c *fiber.Ctx) string {
	if v := c.Locals("userID"); v != nil {
		return v.(string)
	}
	return ""
}

func paginationParams(c *fiber.Ctx) (int, int) {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "20"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	return page, limit
}

// GET /api/courses?page=1&limit=20&category=&level=&search=
func (h *CourseHandler) List(c *fiber.Ctx) error {
	page, limit := paginationParams(c)
	cards, total, err := h.Svc.List(page, limit,
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
func (h *CourseHandler) Create(c *fiber.Ctx) error {
	var req models.CreateCourseRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	resp, err := h.Svc.Create(getUserID(c), req)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to create course", nil, err.Error())
	}
	return utils.JSON(c, http.StatusCreated, true, "course created successfully", resp, nil)
}

// GET /api/courses/:slug — public landing page
func (h *CourseHandler) Landing(c *fiber.Ctx) error {
	resp, err := h.Svc.Landing(c.Params("slug"), getUserID(c))
	if err != nil {
		if err.Error() == "not found" {
			return utils.JSON(c, http.StatusNotFound, false, "course not found", nil, nil)
		}
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to fetch course", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "course fetched successfully", resp, nil)
}

// PATCH /api/courses/:id
func (h *CourseHandler) Update(c *fiber.Ctx) error {
	var req models.UpdateCourseRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	if err := h.Svc.Update(c.Params("id"), req); err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to update course", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "course updated successfully", nil, nil)
}

// DELETE /api/courses/:id
func (h *CourseHandler) Delete(c *fiber.Ctx) error {
	if err := h.Svc.Delete(c.Params("id")); err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to delete course", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "course deleted successfully", nil, nil)
}

// GET /api/courses/:id/study
func (h *CourseHandler) Study(c *fiber.Ctx) error {
	resp, err := h.Svc.Study(c.Params("id"), getUserID(c))
	if err != nil {
		if err.Error() == "not enrolled" {
			return utils.JSON(c, http.StatusForbidden, false, "not enrolled in this course", nil, nil)
		}
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to fetch study page", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "study page fetched successfully", resp, nil)
}

// GET /api/courses/enrolled — enrolled courses
func (h *CourseHandler) Enrolled(c *fiber.Ctx) error {
	list, err := h.Svc.EnrolledCourses(getUserID(c))
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to fetch enrolled courses", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "enrolled courses fetched successfully", list, nil)
}
