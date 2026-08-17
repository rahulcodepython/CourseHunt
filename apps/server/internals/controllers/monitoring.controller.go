package controllers

import (
	"coursehunt/server/internals/config"
	"coursehunt/server/internals/pkg/cache"
	"coursehunt/server/internals/utils"

	"github.com/gofiber/fiber/v2"
	"github.com/jmoiron/sqlx"
	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/disk"
	"github.com/shirou/gopsutil/v3/host"
	"github.com/shirou/gopsutil/v3/mem"
)

type MonitoringController struct {
	DB    *sqlx.DB
	Cache *cache.Cache
	Cfg   *config.Config
}

func NewMonitoringController(db *sqlx.DB, cch *cache.Cache, cfg *config.Config) *MonitoringController {
	return &MonitoringController{DB: db, Cache: cch, Cfg: cfg}
}

type telemetry struct {
	CPUPercent    float64 `json:"cpu_percent"`
	MemoryUsed    uint64  `json:"memory_used_bytes"`
	MemoryTotal   uint64  `json:"memory_total_bytes"`
	MemoryPercent float64 `json:"memory_percent"`
	DiskUsed      uint64  `json:"disk_used_bytes"`
	DiskTotal     uint64  `json:"disk_total_bytes"`
	DiskPercent   float64 `json:"disk_percent"`
	UptimeSeconds uint64  `json:"uptime_seconds"`
}

// MonitoringController serves a live snapshot — no table backs this, it's
// computed fresh on every call, which is exactly what a 5-second polling
// admin page wants (a history table would just be write amplification for
// data nobody looks back at).
func (ctrl *MonitoringController) SnapshotController(c *fiber.Ctx) error {
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

	services, allHealthy := CheckServices(c, ctrl.DB, ctrl.Cache)

	return utils.OK(c, "Monitoring snapshot fetched.", fiber.Map{
		"telemetry":   t,
		"services":    services,
		"all_healthy": allHealthy,
	})
}
