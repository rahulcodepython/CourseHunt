package monitoring

import (
	"errors"

	"coursehunt/server/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (a *App) handleHealth(c *fiber.Ctx) error {
	healthData, allHealthy := a.HealthCheck(c.UserContext())

	if !allHealthy {
		return &utils.APIError{
			Status:  fiber.StatusServiceUnavailable,
			Message: "One or more dependent services are down or unreachable.",
			Data:    healthData,
			Err:     errors.New("service dependency failure"),
		}
	}

	return utils.OK(c, "All service health checks passed successfully.", healthData)
}

func (a *App) handleSnapshot(c *fiber.Ctx) error {
	return utils.OK(c, "Monitoring snapshot fetched.", a.Snapshot(c.UserContext()))
}

func (a *App) handleLokiQuery(c *fiber.Ctx) error {
	limit := c.QueryInt("limit", 50)
	level := c.Query("level", "all")
	search := c.Query("search", "")
	start := c.Query("start", "")
	end := c.Query("end", "")

	logs, err := a.QueryLokiLogs(c.UserContext(), limit, level, search, start, end)
	if err != nil {
		return utils.ErrInternal("Failed to query Loki logs.", err)
	}

	return utils.OK(c, "Loki logs fetched.", logs)
}
