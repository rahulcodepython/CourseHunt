package middlewares

import (
	"fmt"
	"time"

	"coursehunt/server/internals/pkg/middleware"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// LogSchema aliases middleware.LogSchema for backwards compatibility.
type LogSchema = middleware.LogSchema

// LokiLoggerMiddleware streams structured telemetry logs asynchronously into Grafana Loki using config values.
func LokiLoggerMiddleware(lokiURL, env string) fiber.Handler {
	middleware.InitLoki(lokiURL, env)

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
		if u, uErr := middleware.UserFromContext(c); uErr == nil && u != nil {
			userIDStr = u.UserID
		}

		logEntry := middleware.LogSchema{
			Timestamp: time.Now().UTC(),
			Level:     level,
			Message:   fmt.Sprintf("%s %s -> %d", c.Method(), c.Path(), status),
			Service: middleware.ServiceMeta{
				Name:        "coursehunt-api",
				Version:     "1.4.2",
				Environment: middleware.GetLokiEnv(),
			},
			HTTP: middleware.HTTPMeta{
				Method:     c.Method(),
				Path:       c.Path(),
				Route:      routePath,
				StatusCode: status,
				LatencyMS:  latency.Milliseconds(),
				ClientIP:   c.IP(),
				UserAgent:  c.Get("User-Agent"),
			},
			Trace: middleware.TraceMeta{
				RequestID: reqID,
				UserID:    userIDStr,
			},
		}

		if err != nil {
			logEntry.Error = &middleware.ErrorMeta{
				Kind:       "handler_error",
				StackTrace: err.Error(),
			}
		}

		middleware.PushLokiLog(logEntry)

		return err
	}
}
