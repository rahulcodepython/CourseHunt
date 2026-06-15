package v1

import (
	"coursehunt-backend/internals/middlewares"
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
	userID := c.Locals("user").(middlewares.UserContext).UserID
	user, err := h.Users.Current(userID)
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

	userID := c.Locals("user").(middlewares.UserContext).UserID
	updated, err := h.Users.Update(userID, &user)
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

func (h *UserHandler) AssignRoles(c *fiber.Ctx) error {
	var body struct {
		RoleIDs []int `json:"roleIds"`
	}
	if err := c.BodyParser(&body); err != nil || len(body.RoleIDs) == 0 {
		return utils.BadRequest(c, "Invalid request body or empty roleIds")
	}

	if err := h.Users.AssignRoles(c.Params("id"), body.RoleIDs); err != nil {
		return utils.InternalError(c, "Failed to assign roles")
	}

	return utils.OK(c, "Roles assigned successfully", nil)
}

func (h *UserHandler) RevokeRoles(c *fiber.Ctx) error {
	var body struct {
		RoleIDs []int `json:"roleIds"`
	}
	if err := c.BodyParser(&body); err != nil || len(body.RoleIDs) == 0 {
		return utils.BadRequest(c, "Invalid request body or empty roleIds")
	}

	if err := h.Users.RevokeRoles(c.Params("id"), body.RoleIDs); err != nil {
		return utils.InternalError(c, "Failed to revoke roles")
	}

	return utils.OK(c, "Roles revoked successfully", nil)
}
