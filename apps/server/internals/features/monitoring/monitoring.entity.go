package monitoring

type ServiceStatus struct {
	Status string `json:"status"`
	Error  string `json:"error,omitempty"`
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
