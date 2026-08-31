package logs

import (
	"coursehunt/server/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (a *App) handleList(c *fiber.Ctx) error {
	afterID, beforeID, limit := utils.CursorParams(c)

	list, err := a.List(c.Context(), afterID, beforeID, limit)
	if err != nil {
		return err
	}

	return utils.OK(c, "Logs fetched successfully.", list)
}
