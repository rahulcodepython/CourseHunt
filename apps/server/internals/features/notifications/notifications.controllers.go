package notifications

import (
	"coursehunt/server/internals/middlewares"
	"coursehunt/server/internals/utils"

	"github.com/gofiber/fiber/v2"
)

// handleList serves the shared admin/tutor notifications feed — the role on
// the authenticated user decides which rows are visible (see
// roleColumnFor). A plain "user" account gets an empty list rather than an
// error; students don't have a notifications feed (they have the separate
// Updates feature).
func (a *App) handleList(c *fiber.Ctx) error {
	user, err := middlewares.UserFromContext(c)
	if err != nil {
		return utils.ErrUnauthorized("Unauthorized.", err)
	}

	afterID, beforeID, limit := utils.CursorParams(c)

	list, err := a.List(c.Context(), user.UserID, user.Role, afterID, beforeID, limit)
	if err != nil {
		return err
	}

	return utils.OK(c, "Notifications fetched successfully.", list)
}
