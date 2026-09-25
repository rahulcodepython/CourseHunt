package upload

import (
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/middlewares"
	"coursehunt/server/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (a *App) handleGetSignedURL(c *fiber.Ctx) error {
	user, err := middlewares.UserFromContext(c)
	if err != nil {
		return utils.ErrUnauthorized("Unauthorized.", err)
	}

	fileName := c.Query("file_name")

	resp, err := a.GetSignedURL(c.UserContext(), user.UserID, user.Role, fileName)
	if err != nil {
		return err
	}

	return utils.OK(c, generic.MsgSignedURLGenerated, resp)
}
