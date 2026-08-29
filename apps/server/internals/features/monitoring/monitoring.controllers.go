package monitoring

import (
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (a *App) handleHealth(c *fiber.Ctx) error {
	healthData, allHealthy := a.HealthCheck(c.Context())

	if !allHealthy {
		return c.Status(fiber.StatusServiceUnavailable).JSON(generic.Response[any]{
			Success: false,
			Message: "One or more dependent services are down or unreachable.",
			Data:    healthData,
			Error:   "service dependency failure",
		})
	}

	return utils.OK(c, "All service health checks passed successfully.", healthData)
}

func (a *App) handleSnapshot(c *fiber.Ctx) error {
	return utils.OK(c, "Monitoring snapshot fetched.", a.Snapshot(c.Context()))
}
