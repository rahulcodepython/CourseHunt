package controllers

import (
	"coursehunt/server/internals/config"
	"coursehunt/server/internals/repositories"
	"coursehunt/server/internals/utils"

	"github.com/gofiber/fiber/v2"
)

type LogsController struct {
	Repo *repositories.LogsRepository
	Cfg  *config.Config
}

func NewLogsController(repo *repositories.LogsRepository, cfg *config.Config) *LogsController {
	return &LogsController{Repo: repo, Cfg: cfg}
}

func (ctrl *LogsController) ListController(c *fiber.Ctx) error {
	afterID, beforeID, limit := utils.CursorParams(c)

	list, err := ctrl.Repo.ListRepository(afterID, beforeID, limit)
	if err != nil {
		return utils.InternalError(c, "Failed to fetch logs.", err)
	}

	return utils.OK(c, "Logs fetched successfully.", list)
}
