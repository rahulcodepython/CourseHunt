package monitoring

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"net/url"
	"sort"
	"strconv"
	"time"

	"coursehunt/server/internals/middlewares"

	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/disk"
	"github.com/shirou/gopsutil/v3/host"
	"github.com/shirou/gopsutil/v3/mem"
)

// HealthCheck reports up/down status for every dependent service.
func (a *App) HealthCheck(ctx context.Context) (HealthResponse, bool) {
	services, allHealthy := a.checkServices(ctx)

	statusStr := "healthy"
	if !allHealthy {
		statusStr = "unhealthy"
	}

	return HealthResponse{
		Status:    statusStr,
		Timestamp: time.Now().Format(time.RFC3339),
		Version:   "1.0.0",
		Services:  services,
	}, allHealthy
}

// Snapshot serves a live telemetry+service snapshot — no table backs this,
// it's computed fresh on every call, which is exactly what a 5-second
// polling admin page wants (a history table would just be write
// amplification for data nobody looks back at).
func (a *App) Snapshot(ctx context.Context) SnapshotResponse {
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

	return SnapshotResponse{
		Telemetry:  t,
		Services:   services,
		AllHealthy: allHealthy,
	}
}

// QueryLokiLogs queries Grafana Loki for log streams and returns structured LogSchema entries.
func (a *App) QueryLokiLogs(ctx context.Context, limit int, level, search, start, end string) ([]middlewares.LogSchema, error) {
	if limit <= 0 {
		limit = 50
	}
	if limit > 500 {
		limit = 500
	}

	query := `{app="coursehunt-backend"}`
	if level != "" && level != "all" {
		query = fmt.Sprintf(`{app="coursehunt-backend", level="%s"}`, level)
	}
	if search != "" {
		query = fmt.Sprintf(`%s |= %q`, query, search)
	}

	lokiURL := a.Cfg.LokiURL
	if lokiURL == "" {
		lokiURL = "http://loki:3100"
	}

	u, err := url.Parse(lokiURL + "/loki/api/v1/query_range")
	if err != nil {
		return []middlewares.LogSchema{}, nil
	}

	q := u.Query()
	q.Set("query", query)
	q.Set("limit", strconv.Itoa(limit))
	q.Set("direction", "BACKWARD")
	if start != "" {
		q.Set("start", start)
	}
	if end != "" {
		q.Set("end", end)
	}
	u.RawQuery = q.Encode()

	req, err := http.NewRequestWithContext(ctx, "GET", u.String(), nil)
	if err != nil {
		return []middlewares.LogSchema{}, nil
	}

	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		slog.Warn("failed to query loki", "error", err)
		return []middlewares.LogSchema{}, nil
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		slog.Warn("loki query returned non-200", "status", resp.StatusCode)
		return []middlewares.LogSchema{}, nil
	}

	var lokiResp LokiQueryResponse
	if err := json.NewDecoder(resp.Body).Decode(&lokiResp); err != nil {
		slog.Warn("failed to decode loki response", "error", err)
		return []middlewares.LogSchema{}, nil
	}

	logs := make([]middlewares.LogSchema, 0, limit)
	for _, stream := range lokiResp.Data.Result {
		for _, val := range stream.Values {
			if len(val) >= 2 {
				var entry middlewares.LogSchema
				if err := json.Unmarshal([]byte(val[1]), &entry); err == nil {
					logs = append(logs, entry)
				}
			}
		}
	}

	sort.Slice(logs, func(i, j int) bool {
		return logs[i].Timestamp.After(logs[j].Timestamp)
	})

	if len(logs) > limit {
		logs = logs[:limit]
	}

	return logs, nil
}
