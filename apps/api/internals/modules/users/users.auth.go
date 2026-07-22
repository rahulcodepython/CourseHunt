package users

import (
	"coursehunt/api/internals/generic"
	"coursehunt/api/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (m *UsersModule) ClearPasswordChangedAtController(c *fiber.Ctx) error {
	user, ok := c.Locals("user").(generic.UserContext)
	if !ok {
		return utils.Unauthorized(c, "Unauthorized.", nil)
	}

	if err := m.ClearPasswordChangedAtRepository(user.UserID); err != nil {
		return utils.InternalError(c, "Failed to clear password changed at.", err)
	}

	return utils.OK(c, "Password changed at cleared.", fiber.Map{})
}
