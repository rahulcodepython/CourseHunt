package notifications

import (
	"coursehunt/server/internals/middlewares"
	"coursehunt/server/internals/utils"

	"github.com/gofiber/fiber/v2"
)

// handleList serves the shared admin/tutor notifications feed — guarded at
// the route level by RoleGuard(generic.RoleAdmin, generic.RoleTutor).
func (a *App) handleList(c *fiber.Ctx) error {
	user, err := middlewares.UserFromContext(c)
	if err != nil {
		return utils.ErrUnauthorized("Unauthorized.", err)
	}

	afterID, beforeID, limit := utils.CursorParams(c)

	list, err := a.List(c.UserContext(), user.UserID, user.Role, afterID, beforeID, limit)
	if err != nil {
		return err
	}

	return utils.OK(c, "Notifications fetched successfully.", list)
}

type markSeenRequest struct {
	LastSeenID int64 `json:"last_seen_id"`
}

func (a *App) handleMarkSeen(c *fiber.Ctx) error {
	user, err := middlewares.UserFromContext(c)
	if err != nil {
		return utils.ErrUnauthorized("Unauthorized.", err)
	}

	var req markSeenRequest
	if err := c.BodyParser(&req); err != nil || req.LastSeenID <= 0 {
		return utils.ErrBadRequest("Invalid or missing last_seen_id.", err)
	}

	if err := a.MarkSeen(c.UserContext(), user.UserID, user.Role, req.LastSeenID); err != nil {
		return err
	}

	return utils.OKEmpty(c, "Notifications marked as seen successfully.")
}
