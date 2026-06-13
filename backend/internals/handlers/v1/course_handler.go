package v1

import (
	"coursehunt-backend/internals/services"
	"coursehunt-backend/internals/utils"

	"github.com/gofiber/fiber/v2"
)

type CourseHandler struct {
	Courses *services.CourseService
}

func NewCourseHandler() *CourseHandler {
	return &CourseHandler{Courses: services.NewCourseService()}
}

func (h *CourseHandler) PublicCourses(c *fiber.Ctx) error {
	courses, err := h.Courses.PublicCourses(4)
	if err != nil {
		return utils.InternalError(c, "Failed to fetch courses")
	}
	return utils.OK(c, "Courses fetched successfully", courses)
}

func (h *CourseHandler) Course(c *fiber.Ctx) error {
	id, err := idParam(c)
	if err != nil {
		return utils.BadRequest(c, "Invalid course ID")
	}
	course, err := h.Courses.Course(id)
	if err != nil {
		return utils.BadRequest(c, "Course not found")
	}
	return utils.OK(c, "Course fetched successfully", course)
}

func (h *CourseHandler) Categories(c *fiber.Ctx) error {
	categories, err := h.Courses.Categories()
	if err != nil {
		return utils.InternalError(c, "Failed to fetch categories")
	}
	return utils.OK(c, "Categories fetched successfully", serializeCategories(categories))
}

func (h *CourseHandler) AdminCourses(c *fiber.Ctx) error {
	courses, err := h.Courses.AdminCourses(authUserID(c), authPosition(c))
	if err != nil {
		return utils.InternalError(c, "Failed to fetch courses")
	}
	return utils.OK(c, "Courses fetched successfully", courses)
}

func (h *CourseHandler) CreateCourse(c *fiber.Ctx) error {
	var body struct {
		Title string `json:"title"`
	}
	if err := c.BodyParser(&body); err != nil {
		return utils.BadRequest(c, "Invalid request body")
	}
	course, err := h.Courses.Create(body.Title, authUserID(c))
	if err != nil {
		return utils.BadRequest(c, err.Error())
	}
	return utils.Created(c, "Course created successfully", fiber.Map{"course": course})
}

func (h *CourseHandler) UpdateCourse(c *fiber.Ctx) error {
	id, err := idParam(c)
	if err != nil {
		return utils.BadRequest(c, "Invalid course ID")
	}

	// Fetch existing course to merge updates
	existing, err := h.Courses.Course(id)
	if err != nil {
		return utils.BadRequest(c, "Course not found")
	}

	// Parse updates into the existing course object
	if err := c.BodyParser(existing); err != nil {
		return utils.BadRequest(c, "Invalid request body")
	}

	updated, err := h.Courses.Update(id, existing)
	if err != nil {
		return utils.InternalError(c, "Failed to update course")
	}
	return utils.OK(c, "Course updated successfully", updated)
}

func (h *CourseHandler) DeleteCourse(c *fiber.Ctx) error {
	id, err := idParam(c)
	if err != nil {
		return utils.BadRequest(c, "Invalid course ID")
	}
	if err := h.Courses.Delete(id); err != nil {
		return utils.InternalError(c, "Failed to delete course")
	}
	return utils.OK(c, "Course deleted successfully", fiber.Map{"message": "Course deleted successfully"})
}
