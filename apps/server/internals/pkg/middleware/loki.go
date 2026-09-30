package middleware

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"sync"
	"time"
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
	lokiQueue     chan LogSchema
	lokiQueueOnce sync.Once
	lokiClient    = &http.Client{Timeout: 5 * time.Second}
	lokiURL       string
	lokiEnv       string
)

// InitLoki initializes the Loki background batch worker with settings from config.
func InitLoki(endpoint, environment string) {
	lokiURL = endpoint
	lokiEnv = environment

	lokiQueueOnce.Do(func() {
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
	})
}

// PushLokiLog queues a log entry for asynchronous batch push to Loki.
func PushLokiLog(entry LogSchema) {
	if lokiQueue == nil {
		return
	}
	select {
	case lokiQueue <- entry:
	default:
		// Drop gracefully on saturated channel
	}
}

// GetLokiEnv returns the configured environment string.
func GetLokiEnv() string {
	return lokiEnv
}

func flushLokiBatch(entries []LogSchema) {
	if len(entries) == 0 || lokiURL == "" {
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
				"env":         lokiEnv,
			},
			Values: values,
		})
	}

	payload := LokiPushPayload{Streams: streams}
	data, err := json.Marshal(payload)
	if err != nil {
		return
	}

	req, err := http.NewRequestWithContext(context.Background(), "POST", lokiURL+"/loki/api/v1/push", bytes.NewReader(data))
	if err == nil {
		req.Header.Set("Content-Type", "application/json")
		resp, postErr := lokiClient.Do(req)
		if postErr == nil {
			resp.Body.Close()
		}
	}
}
