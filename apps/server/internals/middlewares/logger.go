package middlewares

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
)

// LoggerMiddleware records structured request metrics, logs API errors with sanitized request bodies,
// and enqueues operational audit records to PostgreSQL asynchronously.
func LoggerMiddleware(db *pgxpool.Pool) fiber.Handler {
	if db != nil {
		auditQueueOnce.Do(startAuditWorkers)
	}

	return func(c *fiber.Ctx) error {
		start := time.Now()

		// Proceed with request pipeline without eagerly copying c.Body() on the hot path
		err := c.Next()

		latency := time.Since(start)
		status := c.Response().StatusCode()

		// Handle cases where err was returned directly to middleware
		if err != nil {
			c.Locals("handler_error", err)
		}

		handlerErr := c.Locals("handler_error")
		handlerMsg := c.Locals("handler_error_msg")

		routePath := "-"
		if r := c.Route(); r != nil {
			routePath = r.Path
		}

		// Check if this request represents an error (status >= 400 or has error attached)
		if status >= 400 || handlerErr != nil {
			// Extract user info only on error path
			var actorUserID *string
			userInfo := "Anonymous / Unauthenticated"
			if u, uErr := UserFromContext(c); uErr == nil && u != nil {
				actorUserID = &u.UserID
				userInfo = fmt.Sprintf("UserID: %s | Roles: %v", u.UserID, u.Roles)
			}

			// Error detail extraction
			var errDetail string
			if handlerErr != nil {
				if e, ok := handlerErr.(error); ok {
					errDetail = e.Error()
				} else {
					errDetail = fmt.Sprintf("%v", handlerErr)
				}
			}
			if handlerMsg != nil {
				if errDetail != "" {
					errDetail = fmt.Sprintf("%v (%s)", handlerMsg, errDetail)
				} else {
					errDetail = fmt.Sprintf("%v", handlerMsg)
				}
			}
			if errDetail == "" {
				errDetail = fmt.Sprintf("HTTP %d %s", status, http.StatusText(status))
			}

			// Format parameters JSON lazily
			queryStr := "{}"
			if q := c.Queries(); len(q) > 0 {
				if qBytes, e := json.Marshal(q); e == nil {
					queryStr = string(qBytes)
				}
			}
			pathStr := "{}"
			if p := c.AllParams(); len(p) > 0 {
				if pBytes, e := json.Marshal(p); e == nil {
					pathStr = string(pBytes)
				}
			}

			// Sanitized Body (only inspected on error)
			sanitizedBody := sanitizeRequestBody(c.Body())

			slog.Error("api failure",
				"method", c.Method(), "url", c.OriginalURL(), "route", routePath,
				"status", status, "status_text", http.StatusText(status),
				"error", errDetail,
				"user", userInfo,
				"ip", c.IP(), "x_forwarded_for", c.Get("X-Forwarded-For", "-"),
				"user_agent", c.Get("User-Agent", "-"),
				"referer", c.Get("Referer", "-"), "origin", c.Get("Origin", "-"),
				"query_params", queryStr,
				"path_params", pathStr,
				"request_body", sanitizedBody,
				"latency_ms", latency.Milliseconds(),
			)

			if shouldAudit(c.Method(), status) {
				logMessage := fmt.Sprintf("%s %s → %d %s", c.Method(), routePath, status, http.StatusText(status))
				notifMessage := fmt.Sprintf("System error on %s %s: %s", c.Method(), routePath, errDetail)
				writeAuditRow(db, c.Method(), routePath, status, actorUserID, c.IP(), c.Get("User-Agent", "-"), logMessage, notifMessage)
			}
		} else {
			// Standard info log for healthy 2xx/3xx requests
			slog.Info("api request",
				"method", c.Method(), "url", c.OriginalURL(), "status", status,
				"latency_ms", latency.Milliseconds(), "ip", c.IP())

			if shouldAudit(c.Method(), status) {
				var actorUserID *string
				if u, uErr := UserFromContext(c); uErr == nil && u != nil {
					actorUserID = &u.UserID
				}
				logMessage := fmt.Sprintf("%s %s → %d %s", c.Method(), routePath, status, http.StatusText(status))
				writeAuditRow(db, c.Method(), routePath, status, actorUserID, c.IP(), c.Get("User-Agent", "-"), logMessage, "")
			}
		}

		return err
	}
}
