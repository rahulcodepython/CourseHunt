package controllers

import (
	"time"

	"coursehunt/server/internals/config"
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/pkg/cache"
	"coursehunt/server/internals/pkg/minio"
	"coursehunt/server/internals/utils"

	"github.com/gofiber/fiber/v2"
	"github.com/jmoiron/sqlx"
)

type HealthController struct {
	DB    *sqlx.DB
	Cache *cache.Cache
	Cfg   *config.Config
}

func NewHealthController(db *sqlx.DB, cch *cache.Cache, cfg *config.Config) *HealthController {
	return &HealthController{DB: db, Cache: cch, Cfg: cfg}
}

type ServiceStatus struct {
	Status string `json:"status"`
	Error  string `json:"error,omitempty"`
}

// CheckServices pings every backing service this API depends on. Shared by
// HealthCheckController and MonitoringController so the two don't maintain
// two copies of the same up/down logic.
func CheckServices(c *fiber.Ctx, db *sqlx.DB, cch *cache.Cache) (map[string]ServiceStatus, bool) {
	services := make(map[string]ServiceStatus)
	allHealthy := true

	services["backend"] = ServiceStatus{Status: "up"}

	if err := db.Ping(); err != nil {
		allHealthy = false
		services["postgres"] = ServiceStatus{Status: "down", Error: err.Error()}
	} else {
		services["postgres"] = ServiceStatus{Status: "up"}
	}

	if err := cch.Ping(c.Context()); err != nil {
		allHealthy = false
		services["redis"] = ServiceStatus{Status: "down", Error: err.Error()}
	} else {
		services["redis"] = ServiceStatus{Status: "up"}
	}

	if err := minio.Ping(c.Context()); err != nil {
		allHealthy = false
		services["minio"] = ServiceStatus{Status: "down", Error: err.Error()}
	} else {
		services["minio"] = ServiceStatus{Status: "up"}
	}

	return services, allHealthy
}

func (ctrl *HealthController) HealthCheckController(c *fiber.Ctx) error {
	services, allHealthy := CheckServices(c, ctrl.DB, ctrl.Cache)

	statusStr := "healthy"
	if !allHealthy {
		statusStr = "unhealthy"
	}

	healthData := fiber.Map{
		"status":    statusStr,
		"timestamp": time.Now().Format(time.RFC3339),
		"version":   "1.0.0",
		"services":  services,
	}

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
