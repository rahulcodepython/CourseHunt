package v1

import (
	"strconv"

	"coursehunt-backend/internals/middlewares"
	"coursehunt-backend/internals/services"
	"coursehunt-backend/internals/utils"
	"github.com/gofiber/fiber/v2"
)

type StudyHandler struct {
	Study *services.StudyService
}

func NewStudyHandler() *StudyHandler {
	return &StudyHandler{Study: services.NewStudyService()}
}

func (h *StudyHandler) StudyData(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return utils.BadRequest(c, "Invalid course ID")
	}
	userID := c.Locals("user").(middlewares.UserContext).UserID
	data, err := h.Study.StudyData(userID, id)
	if err != nil {
		return utils.BadRequest(c, "You haven't purchased the course")
	}
	return utils.OK(c, "Study data fetched successfully", data)
}

func (h *StudyHandler) MarkLessonRead(c *fiber.Ctx) error {
	var body struct {
		CourseID  int `json:"courseId"`
		ChapterID int `json:"chapterId"`
		LessonID  int `json:"lessonId"`
	}
	if err := c.BodyParser(&body); err != nil || body.CourseID == 0 || body.ChapterID == 0 || body.LessonID == 0 {
		return utils.BadRequest(c, "Missing required fields")
	}
	userID := c.Locals("user").(middlewares.UserContext).UserID
	changed, err := h.Study.MarkLessonRead(userID, body.CourseID, body.ChapterID, body.LessonID)
	if err != nil {
		return utils.InternalError(c, "Failed to mark lesson as read")
	}
	if !changed {
		return utils.OK(c, "Lesson already marked as read", fiber.Map{"message": "Lesson already marked as read"})
	}
	return utils.OK(c, "Lesson marked as read", fiber.Map{"message": "Lesson marked as read"})
}

func (h *StudyHandler) SetLastViewed(c *fiber.Ctx) error {
	var body struct {
		CourseID int `json:"courseId"`
		LessonID int `json:"lessonId"`
	}
	if err := c.BodyParser(&body); err != nil || body.CourseID == 0 || body.LessonID == 0 {
		return utils.BadRequest(c, "Missing lessonId or courseId")
	}
	userID := c.Locals("user").(middlewares.UserContext).UserID
	if err := h.Study.SetLastViewed(userID, body.CourseID, body.LessonID); err != nil {
		return utils.InternalError(c, "Failed to update last viewed lesson")
	}
	return utils.OK(c, "Last viewed lesson updated", fiber.Map{"message": "Last viewed lesson updated"})
}

func (h *StudyHandler) UserCourseNames(c *fiber.Ctx) error {
	userID := c.Locals("user").(middlewares.UserContext).UserID
	courses, err := h.Study.UserCourses(userID, true)
	if err != nil {
		return utils.InternalError(c, "Failed to fetch courses")
	}
	return utils.OK(c, "Courses fetched successfully", fiber.Map{"courses": courses})
}

func (h *StudyHandler) UserCourses(c *fiber.Ctx) error {
	userID := c.Locals("user").(middlewares.UserContext).UserID
	courses, err := h.Study.UserCourses(userID, false)
	if err != nil {
		return utils.InternalError(c, "Failed to fetch courses")
	}
	return utils.OK(c, "Courses fetched successfully", fiber.Map{"courses": courses})
}
