package monitoring

import (
	"context"
	"time"

	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/disk"
	"github.com/shirou/gopsutil/v3/host"
	"github.com/shirou/gopsutil/v3/mem"
)

// HealthCheck reports up/down status for every dependent service.
func (a *App) HealthCheck(ctx context.Context) (map[string]any, bool) {
	services, allHealthy := a.checkServices(ctx)

	statusStr := "healthy"
	if !allHealthy {
		statusStr = "unhealthy"
	}

	return map[string]any{
		"status":    statusStr,
		"timestamp": time.Now().Format(time.RFC3339),
		"version":   "1.0.0",
		"services":  services,
	}, allHealthy
}

// Snapshot serves a live telemetry+service snapshot — no table backs this,
// it's computed fresh on every call, which is exactly what a 5-second
// polling admin page wants (a history table would just be write
// amplification for data nobody looks back at).
func (a *App) Snapshot(ctx context.Context) map[string]any {
	t := telemetry{}

	if percents, err := cpu.Percent(0, false); err == nil && len(percents) > 0 {
		t.CPUPercent = percents[0]
	}

	if vm, err := mem.VirtualMemory(); err == nil {
		t.MemoryUsed = vm.Used
		t.MemoryTotal = vm.Total
		t.MemoryPercent = vm.UsedPercent
	}

	if du, err := disk.Usage("/"); err == nil {
		t.DiskUsed = du.Used
		t.DiskTotal = du.Total
		t.DiskPercent = du.UsedPercent
	}

	if uptime, err := host.Uptime(); err == nil {
		t.UptimeSeconds = uptime
	}

	services, allHealthy := a.checkServices(ctx)

	return map[string]any{
		"telemetry":   t,
		"services":    services,
		"all_healthy": allHealthy,
	}
}
