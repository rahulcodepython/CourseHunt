package v1

import (
	"coursehunt-backend/internals/services"
	"coursehunt-backend/internals/utils"
	"github.com/gofiber/fiber/v2"
)

type FeedbackHandler struct {
	Feedbacks *services.FeedbackService
}

func NewFeedbackHandler() *FeedbackHandler {
	return &FeedbackHandler{Feedbacks: services.NewFeedbackService()}
}

func (h *FeedbackHandler) FeedbacksList(c *fiber.Ctx) error {
	feedbacks, err := h.Feedbacks.List(authUserID(c), authPosition(c))
	if err != nil {
		return utils.InternalError(c, "Failed to fetch feedback")
	}
	return utils.OK(c, "Feedback fetched successfully", fiber.Map{"feedbacks": feedbacks})
}

func (h *FeedbackHandler) CreateFeedback(c *fiber.Ctx) error {
	var body struct {
		CourseID int    `json:"courseId"`
		Message  string `json:"message"`
		Rating   int    `json:"rating"`
	}
	if err := c.BodyParser(&body); err != nil || body.CourseID == 0 || body.Message == "" {
		return utils.BadRequest(c, "Missing required fields")
	}
	if err := h.Feedbacks.Create(authUserID(c), body.CourseID, body.Message, body.Rating); err != nil {
		return utils.InternalError(c, "Failed to submit feedback")
	}
	return utils.OK(c, "Feedback submitted successfully", fiber.Map{"message": "Feedback submitted successfully"})
}

func (h *FeedbackHandler) PinFeedback(c *fiber.Ctx) error {
	id, err := idParam(c)
	if err != nil {
		return utils.BadRequest(c, "Invalid feedback ID")
	}
	var body struct {
		Pinned bool `json:"pinned"`
	}
	if err := c.BodyParser(&body); err != nil {
		return utils.BadRequest(c, "Invalid request body")
	}
	if err := h.Feedbacks.SetPinned(id, body.Pinned); err != nil {
		return utils.InternalError(c, "Failed to update pinned status")
	}
	return utils.OK(c, "Feedback pinned status updated", nil)
}

func (h *FeedbackHandler) DeleteFeedback(c *fiber.Ctx) error {
	id, err := idParam(c)
	if err != nil {
		return utils.BadRequest(c, "Invalid feedback ID")
	}
	if err := h.Feedbacks.Delete(id); err != nil {
		return utils.InternalError(c, "Failed to delete feedback")
	}
	return utils.OK(c, "Feedback deleted successfully", nil)
}
