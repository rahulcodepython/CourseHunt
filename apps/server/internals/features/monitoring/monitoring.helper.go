package monitoring

import "context"

// checkServices pings every backing service this API depends on. Shared by
// handleHealth and handleSnapshot so the two don't maintain two copies of
// the same up/down logic.
func (a *App) checkServices(ctx context.Context) (map[string]ServiceStatus, bool) {
	services := make(map[string]ServiceStatus)
	allHealthy := true

	services["backend"] = ServiceStatus{Status: "up"}

	if err := a.DB.Ping(ctx); err != nil {
		allHealthy = false
		services["postgres"] = ServiceStatus{Status: "down", Error: err.Error()}
	} else {
		services["postgres"] = ServiceStatus{Status: "up"}
	}

	if a.Cache.Client() == nil {
		services["redis"] = ServiceStatus{Status: "disabled"}
	} else if err := a.Cache.Ping(ctx); err != nil {
		allHealthy = false
		services["redis"] = ServiceStatus{Status: "down", Error: err.Error()}
	} else {
		services["redis"] = ServiceStatus{Status: "up"}
	}

	if a.Storage == nil {
		services["minio"] = ServiceStatus{Status: "disabled"}
	} else if err := a.Storage.Ping(ctx); err != nil {
		allHealthy = false
		services["minio"] = ServiceStatus{Status: "down", Error: err.Error()}
	} else {
		services["minio"] = ServiceStatus{Status: "up"}
	}

	return services, allHealthy
}
