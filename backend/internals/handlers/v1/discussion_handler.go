package v1

import (
	"coursehunt-backend/internals/services"
	"coursehunt-backend/internals/utils"
	"github.com/gofiber/fiber/v2"
	"strconv"
)

type DiscussionHandler struct {
	Service *services.DiscussionService
}

func NewDiscussionHandler() *DiscussionHandler {
	return &DiscussionHandler{Service: services.NewDiscussionService()}
}

func (h *DiscussionHandler) ListByLesson(c *fiber.Ctx) error {
	lessonID, err := strconv.Atoi(c.Params("lessonId"))
	if err != nil {
		return utils.BadRequest(c, "Invalid lesson ID")
	}
	discussions, err := h.Service.ListByLesson(lessonID)
	if err != nil {
		return utils.InternalError(c, "Failed to fetch discussions")
	}
	return utils.OK(c, "Discussions fetched successfully", discussions)
}

func (h *DiscussionHandler) Create(c *fiber.Ctx) error {
	var body struct {
		LessonID int    `json:"lessonId"`
		Message  string `json:"message"`
		ParentID *int   `json:"parentId"`
	}
	if err := c.BodyParser(&body); err != nil || body.LessonID == 0 || body.Message == "" {
		return utils.BadRequest(c, "Missing required fields")
	}
	discussion, err := h.Service.Create(body.LessonID, authUserID(c), body.Message, body.ParentID)
	if err != nil {
		return utils.InternalError(c, "Failed to create discussion")
	}
	return utils.Created(c, "Discussion created successfully", discussion)
}

func (h *DiscussionHandler) Delete(c *fiber.Ctx) error {
	id, err := idParam(c)
	if err != nil {
		return utils.BadRequest(c, "Invalid discussion ID")
	}
	if err := h.Service.Delete(id); err != nil {
		return utils.InternalError(c, "Failed to delete discussion")
	}
	return utils.OK(c, "Discussion deleted successfully", nil)
}
