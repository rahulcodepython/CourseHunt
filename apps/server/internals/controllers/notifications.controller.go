package controllers

import (
	"coursehunt/server/internals/config"
	"coursehunt/server/internals/repositories"
	"coursehunt/server/internals/utils"

	"github.com/gofiber/fiber/v2"
)

type NotificationsController struct {
	Repo *repositories.NotificationsRepository
	Cfg  *config.Config
}

func NewNotificationsController(repo *repositories.NotificationsRepository, cfg *config.Config) *NotificationsController {
	return &NotificationsController{Repo: repo, Cfg: cfg}
}

// ListController serves the shared admin/tutor notifications feed — the role
// on the authenticated user decides which rows are visible (see
// NotificationsRepository.roleColumnFor). A plain "user" account gets an
// empty list rather than an error; students don't have a notifications feed
// (they have the separate Updates feature).
func (ctrl *NotificationsController) ListController(c *fiber.Ctx) error {
	user := utils.GetUserFromCtx(c)
	if user == nil {
		return utils.Unauthorized(c, "Unauthorized.", nil)
	}

	afterID, beforeID, limit := utils.CursorParams(c)

	list, err := ctrl.Repo.ListRepository(user.UserID, user.Role, afterID, beforeID, limit)
	if err != nil {
		return utils.InternalError(c, "Failed to fetch notifications.", err)
	}

	return utils.OK(c, "Notifications fetched successfully.", list)
}
