package controllers

import (
	"coursehunt/server/internals/config"
	"coursehunt/server/internals/repositories"
	"coursehunt/server/internals/utils"

	"github.com/gofiber/fiber/v2"
)

type SecurityController struct {
	Repo *repositories.SecurityRepository
	Cfg  *config.Config
}

func NewSecurityController(repo *repositories.SecurityRepository, cfg *config.Config) *SecurityController {
	return &SecurityController{Repo: repo, Cfg: cfg}
}

func (ctrl *SecurityController) ListEventsController(c *fiber.Ctx) error {
	afterID, beforeID, limit := utils.CursorParams(c)
	eventType := c.Query("event_type")

	list, err := ctrl.Repo.ListEventsRepository(eventType, afterID, beforeID, limit)
	if err != nil {
		return utils.InternalError(c, "Failed to fetch security events.", err)
	}

	return utils.OK(c, "Security events fetched successfully.", list)
}

func (ctrl *SecurityController) StatsController(c *fiber.Ctx) error {
	stats, err := ctrl.Repo.StatsRepository()
	if err != nil {
		return utils.InternalError(c, "Failed to fetch security stats.", err)
	}

	return utils.OK(c, "Security stats fetched successfully.", stats)
}
