package v1

import (
	"strconv"
	"time"

	"coursehunt-backend/internals/middlewares"
	"coursehunt-backend/internals/services"
	"coursehunt-backend/internals/utils"

	"github.com/gofiber/fiber/v2"
)

type UpdateHandler struct {
	Service *services.UpdateService
}

func NewUpdateHandler() *UpdateHandler {
	return &UpdateHandler{Service: services.NewUpdateService()}
}

func (h *UpdateHandler) AllUpdates(c *fiber.Ctx) error {
	updates, err := h.Service.All()
	if err != nil {
		return utils.InternalError(c, "Failed to fetch updates")
	}
	return utils.OK(c, "Updates fetched successfully", updates)
}

func (h *UpdateHandler) CreateUpdate(c *fiber.Ctx) error {
	var body struct {
		Title       string `json:"title"`
		Description string `json:"description"`
		Date        string `json:"date"`
	}
	if err := c.BodyParser(&body); err != nil {
		return utils.BadRequest(c, "Invalid request body")
	}

	date, err := time.Parse("2006-01-02", body.Date)
	if err != nil {
		date = time.Now()
	}

	update, err := h.Service.Create(body.Title, body.Description, date)
	if err != nil {
		return utils.InternalError(c, "Failed to create update")
	}
	return utils.Created(c, "Update created successfully", update)
}

func (h *UpdateHandler) UpdateUpdate(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return utils.BadRequest(c, "Invalid update ID")
	}

	var body struct {
		Title       string `json:"title"`
		Description string `json:"description"`
		Date        string `json:"date"`
	}
	if err := c.BodyParser(&body); err != nil {
		return utils.BadRequest(c, "Invalid request body")
	}

	date, err := time.Parse("2006-01-02", body.Date)
	if err != nil {
		date = time.Now()
	}

	update, err := h.Service.Update(id, body.Title, body.Description, date)
	if err != nil {
		return utils.InternalError(c, "Failed to update")
	}
	return utils.OK(c, "Update updated successfully", update)
}

func (h *UpdateHandler) DeleteUpdate(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return utils.BadRequest(c, "Invalid update ID")
	}
	if err := h.Service.Delete(id); err != nil {
		return utils.InternalError(c, "Failed to delete update")
	}
	return utils.OK(c, "Update deleted successfully", nil)
}

func (h *UpdateHandler) UnseenUpdates(c *fiber.Ctx) error {
	userID := c.Locals("user").(middlewares.UserContext).UserID
	updates, err := h.Service.GetUnseenAndMarkSeen(userID)
	if err != nil {
		return utils.InternalError(c, "Failed to fetch unseen updates")
	}
	return utils.OK(c, "Unseen updates fetched and marked as seen", updates)
}
