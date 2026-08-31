package upload

import (
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (a *App) handleGetSignedURL(c *fiber.Ctx) error {
	fileName := c.Query("file_name")

	resp, err := a.GetSignedURL(c.Context(), fileName)
	if err != nil {
		return err
	}

	return utils.OK(c, generic.MsgSignedURLGenerated, resp)
}
