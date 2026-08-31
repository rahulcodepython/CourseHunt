package monitoring

import (
	"errors"

	"coursehunt/server/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (a *App) handleHealth(c *fiber.Ctx) error {
	healthData, allHealthy := a.HealthCheck(c.Context())

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
	return utils.OK(c, "Monitoring snapshot fetched.", a.Snapshot(c.Context()))
}
