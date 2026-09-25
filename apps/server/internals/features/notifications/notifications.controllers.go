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
