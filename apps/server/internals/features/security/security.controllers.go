package security

import (
	"coursehunt/server/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (a *App) handleListEvents(c *fiber.Ctx) error {
	afterID, beforeID, limit := utils.CursorParams(c)
	eventType := c.Query("event_type")

	list, err := a.ListEvents(c.Context(), eventType, afterID, beforeID, limit)
	if err != nil {
		return err
	}

	return utils.OK(c, "Security events fetched successfully.", list)
}

func (a *App) handleStats(c *fiber.Ctx) error {
	stats, err := a.Stats(c.Context())
	if err != nil {
		return err
	}

	return utils.OK(c, "Security stats fetched successfully.", stats)
}
