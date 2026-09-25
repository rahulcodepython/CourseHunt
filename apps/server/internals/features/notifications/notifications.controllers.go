package notifications

import (
	"coursehunt/server/internals/generic"
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

	if user.Role != generic.RoleAdmin && user.Role != generic.RoleTutor {
		return utils.ErrForbidden("Access denied. Notifications are only available to tutors and administrators.", nil)
	}

	afterID, beforeID, limit := utils.CursorParams(c)

	list, err := a.List(c.UserContext(), user.UserID, user.Role, afterID, beforeID, limit)
	if err != nil {
		return err
	}

	return utils.OK(c, "Notifications fetched successfully.", list)
}
