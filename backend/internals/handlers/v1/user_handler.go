package v1

import (
	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/services"
	"coursehunt-backend/internals/utils"
	"github.com/gofiber/fiber/v2"
)

type UserHandler struct {
	Users *services.UserService
}

func NewUserHandler() *UserHandler {
	return &UserHandler{Users: services.NewUserService()}
}

func (h *UserHandler) CurrentUser(c *fiber.Ctx) error {
	user, err := h.Users.Current(authUserID(c))
	if err != nil {
		return utils.Unauthorized(c, "User not found")
	}
	return utils.OK(c, "User fetched successfully", serializeUser(user))
}

func (h *UserHandler) UsersList(c *fiber.Ctx) error {
	users, err := h.Users.List()
	if err != nil {
		return utils.InternalError(c, "Failed to fetch users")
	}
	return utils.OK(c, "Users fetched successfully", serializeUsers(users))
}

func (h *UserHandler) UpdateUser(c *fiber.Ctx) error {
	var user models.User
	if err := c.BodyParser(&user); err != nil {
		return utils.BadRequest(c, "Invalid request body")
	}

	var body struct {
		Avatar struct {
			URL string `json:"url"`
		} `json:"avatar"`
	}
	if err := c.BodyParser(&body); err == nil && body.Avatar.URL != "" {
		user.Image = body.Avatar.URL
	}

	updated, err := h.Users.Update(authUserID(c), &user)
	if err != nil {
		return utils.InternalError(c, "Failed to update user")
	}
	return utils.OK(c, "User updated successfully", fiber.Map{"user": serializeUser(updated)})
}

func (h *UserHandler) BanUser(c *fiber.Ctx) error {
	if err := h.Users.Ban(c.Params("id")); err != nil {
		return utils.InternalError(c, "Failed to ban user")
	}
	return utils.OK(c, "User banned successfully", nil)
}

func (h *UserHandler) UnbanUser(c *fiber.Ctx) error {
	if err := h.Users.Unban(c.Params("id")); err != nil {
		return utils.InternalError(c, "Failed to unban user")
	}
	return utils.OK(c, "User unbanned successfully", nil)
}

func (h *UserHandler) SwitchRole(c *fiber.Ctx) error {
	var body struct {
		Role string `json:"role"`
	}
	if err := c.BodyParser(&body); err != nil || body.Role == "" {
		return utils.BadRequest(c, "Invalid role")
	}
	if err := h.Users.SwitchRole(c.Params("id"), body.Role); err != nil {
		return utils.InternalError(c, "Failed to switch role")
	}
	return utils.OK(c, "User role updated successfully", nil)
}
