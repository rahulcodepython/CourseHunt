package middlewares

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"sync"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type ServiceMeta struct {
	Name        string `json:"name"`
	Version     string `json:"version"`
	Environment string `json:"environment"`
}

type HTTPMeta struct {
	Method     string `json:"method"`
	Path       string `json:"path"`
	Route      string `json:"route"`
	StatusCode int    `json:"status_code"`
	LatencyMS  int64  `json:"latency_ms"`
	ClientIP   string `json:"client_ip"`
	UserAgent  string `json:"user_agent"`
}

type TraceMeta struct {
	RequestID string `json:"request_id"`
	UserID    string `json:"user_id,omitempty"`
	SessionID string `json:"session_id,omitempty"`
}

type ErrorMeta struct {
	Kind       string `json:"kind"`
	StackTrace string `json:"stack_trace"`
	RootCause  string `json:"root_cause,omitempty"`
}

type LogSchema struct {
	Timestamp time.Time              `json:"timestamp"`
	Level     string                 `json:"level"`
	Message   string                 `json:"message"`
	Service   ServiceMeta            `json:"service"`
	HTTP      HTTPMeta               `json:"http"`
	Trace     TraceMeta              `json:"trace"`
	Error     *ErrorMeta             `json:"error,omitempty"`
	Metadata  map[string]interface{} `json:"metadata,omitempty"`
}

type LokiStream struct {
	Stream map[string]string `json:"stream"`
	Values [][]string        `json:"values"`
}

type LokiPushPayload struct {
	Streams []LokiStream `json:"streams"`
}

var (
	lokiQueue         chan LogSchema
	lokiQueueOnce     sync.Once
	lokiClient        = &http.Client{Timeout: 5 * time.Second}
	configuredLokiURL = "http://loki:3100"
	configuredEnv     = "production"
)

func getLokiURL() string {
	return configuredLokiURL
}

func startLokiBatchWorker() {
	lokiQueue = make(chan LogSchema, 2048)
	go func() {
		batch := make([]LogSchema, 0, 100)
		ticker := time.NewTicker(1 * time.Second)
		defer ticker.Stop()

		for {
			select {
			case item := <-lokiQueue:
				batch = append(batch, item)
				if len(batch) >= 100 {
					flushLokiBatch(batch)
					batch = make([]LogSchema, 0, 100)
				}
			case <-ticker.C:
				if len(batch) > 0 {
					flushLokiBatch(batch)
					batch = make([]LogSchema, 0, 100)
				}
			}
		}
	}()
}

func flushLokiBatch(entries []LogSchema) {
	if len(entries) == 0 {
		return
	}

	streamsMap := make(map[string][][]string)
	for _, entry := range entries {
		streamKey := fmt.Sprintf("%s|%s|%d", entry.Service.Name, entry.Level, entry.HTTP.StatusCode)
		rawJSON, _ := json.Marshal(entry)
		ts := strconv.FormatInt(entry.Timestamp.UnixNano(), 10)
		streamsMap[streamKey] = append(streamsMap[streamKey], []string{ts, string(rawJSON)})
	}

	var streams []LokiStream
	for key, values := range streamsMap {
		var serviceName, level string
		var statusCodeStr string
		_, _ = fmt.Sscanf(key, "%s|%s|%s", &serviceName, &level, &statusCodeStr)

		streams = append(streams, LokiStream{
			Stream: map[string]string{
				"app":         "coursehunt-backend",
				"service":     serviceName,
				"level":       level,
				"status_code": statusCodeStr,
				"env":         configuredEnv,
			},
			Values: values,
		})
	}

	payload := LokiPushPayload{Streams: streams}
	data, err := json.Marshal(payload)
	if err != nil {
		return
	}

	req, err := http.NewRequestWithContext(context.Background(), "POST", getLokiURL()+"/loki/api/v1/push", bytes.NewReader(data))
	if err == nil {
		req.Header.Set("Content-Type", "application/json")
		resp, postErr := lokiClient.Do(req)
		if postErr == nil {
			resp.Body.Close()
		}
	}
}

// LokiLoggerMiddleware streams structured telemetry logs asynchronously into Grafana Loki.
func LokiLoggerMiddleware(lokiURL, env string) fiber.Handler {
	if lokiURL != "" {
		configuredLokiURL = lokiURL
	}
	if env != "" {
		configuredEnv = env
	}
	lokiQueueOnce.Do(startLokiBatchWorker)

	return func(c *fiber.Ctx) error {
		start := time.Now()
		reqID := c.Get("X-Request-ID")
		if reqID == "" {
			reqID = uuid.NewString()
			c.Set("X-Request-ID", reqID)
		}

		err := c.Next()

		latency := time.Since(start)
		status := c.Response().StatusCode()
		level := "info"
		if status >= 400 && status < 500 {
			level = "warn"
		} else if status >= 500 || err != nil {
			level = "error"
		}

		routePath := "-"
		if r := c.Route(); r != nil {
			routePath = r.Path
		}

		var userIDStr string
		if u, uErr := UserFromContext(c); uErr == nil && u != nil {
			userIDStr = u.UserID
		}

		logEntry := LogSchema{
			Timestamp: time.Now().UTC(),
			Level:     level,
			Message:   fmt.Sprintf("%s %s -> %d", c.Method(), c.Path(), status),
			Service: ServiceMeta{
				Name:        "coursehunt-api",
				Version:     "1.4.2",
				Environment: configuredEnv,
			},
			HTTP: HTTPMeta{
				Method:     c.Method(),
				Path:       c.Path(),
				Route:      routePath,
				StatusCode: status,
				LatencyMS:  latency.Milliseconds(),
				ClientIP:   c.IP(),
				UserAgent:  c.Get("User-Agent"),
			},
			Trace: TraceMeta{
				RequestID: reqID,
				UserID:    userIDStr,
			},
		}

		if err != nil {
			logEntry.Error = &ErrorMeta{
				Kind:       "handler_error",
				StackTrace: err.Error(),
			}
		}

		select {
		case lokiQueue <- logEntry:
		default:
			// Drop gracefully on saturated channel to preserve application latency
		}

		return err
	}
}
