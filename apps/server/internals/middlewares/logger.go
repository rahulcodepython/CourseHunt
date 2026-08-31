package middlewares

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Audit rows are written by a small fixed pool of workers instead of a
// goroutine per request — under a traffic spike or a slow DB, spawning one
// goroutine per request has no upper bound and amplifies the outage instead
// of shedding load. The queue is a bounded buffer; a full queue drops the
// row (audit logging is best-effort and must never add request latency)
// rather than blocking the caller.
const (
	auditWorkerCount = 8
	auditQueueSize   = 512
	maxBodyLogLength = 2048
)

type auditJob struct {
	db                               *pgxpool.Pool
	method, routePath, ip, userAgent string
	status                           int
	userID                           *string
	logMessage, notifMessage         string
}

var (
	auditQueue     chan auditJob
	auditQueueOnce sync.Once
)

func startAuditWorkers() {
	auditQueue = make(chan auditJob, auditQueueSize)
	for range auditWorkerCount {
		go func() {
			for job := range auditQueue {
				execAuditRow(job)
			}
		}()
	}
}

func execAuditRow(j auditJob) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := j.db.Exec(ctx, `
		WITH actor AS (
			SELECT u.email FROM (SELECT $3::uuid AS uid) p
			LEFT JOIN "users" u ON u.id = p.uid
		),
		log_ins AS (
			INSERT INTO logs (message, actor_email, success)
			SELECT $1, actor.email, $2 FROM actor WHERE $4
		),
		notif_ins AS (
			INSERT INTO notifications (type, message, is_admin, is_tutor, is_student)
			SELECT 'system_error', $5, true, false, false WHERE $6 >= 500
		),
		sec_ins AS (
			INSERT INTO security_events (event_type, user_id, email, ip_address, user_agent, path)
			SELECT
				CASE WHEN $6 = 429 THEN 'rate_limit_exceeded' ELSE 'unauthorized_access' END,
				$3::uuid, actor.email, $7, $8, $9
			FROM actor WHERE $6 IN (401, 403, 429)
		)
		SELECT 1
	`, j.logMessage, j.status < 400, j.userID, j.method != fiber.MethodGet, j.notifMessage, j.status, j.ip, j.userAgent, j.routePath)
	if err != nil {
		slog.Error("audit insert failed", "error", err)
	}
}

// containsFold checks whether s contains substr case-insensitively without allocating new strings.
func containsFold(s, substr string) bool {
	if len(substr) == 0 {
		return true
	}
	if len(s) < len(substr) {
		return false
	}
	for i := 0; i <= len(s)-len(substr); i++ {
		if strings.EqualFold(s[i:i+len(substr)], substr) {
			return true
		}
	}
	return false
}

// isSensitiveKey checks whether a key name indicates sensitive credential or card data.
func isSensitiveKey(k string) bool {
	return containsFold(k, "password") ||
		containsFold(k, "secret") ||
		containsFold(k, "token") ||
		containsFold(k, "credit") ||
		containsFold(k, "cvv") ||
		containsFold(k, "card")
}

// sanitizeJSON recursively redacts sensitive fields in-place without duplicating untouched subtrees.
func sanitizeJSON(val any) {
	switch v := val.(type) {
	case map[string]any:
		for k, item := range v {
			if isSensitiveKey(k) {
				v[k] = "[REDACTED]"
			} else {
				sanitizeJSON(item)
			}
		}
	case []any:
		for _, item := range v {
			sanitizeJSON(item)
		}
	}
}

// sanitizeRequestBody returns a sanitized string representation of the request body.
func sanitizeRequestBody(body []byte) string {
	if len(body) == 0 {
		return "{}"
	}

	trimmed := bytes.TrimSpace(body)
	if len(trimmed) == 0 {
		return "{}"
	}

	// Only parse as JSON if it begins with an object or array character
	if trimmed[0] == '{' || trimmed[0] == '[' {
		var parsed any
		if err := json.Unmarshal(trimmed, &parsed); err == nil {
			sanitizeJSON(parsed)
			if out, err := json.Marshal(parsed); err == nil {
				if len(out) > maxBodyLogLength {
					return string(out[:maxBodyLogLength]) + "... [TRUNCATED]"
				}
				return string(out)
			}
		}
	}

	if len(trimmed) > maxBodyLogLength {
		return string(trimmed[:maxBodyLogLength]) + "... [TRUNCATED]"
	}
	return string(trimmed)
}

// shouldAudit returns whether a request produces any audit log, notification, or security event row.
func shouldAudit(method string, status int) bool {
	return method != fiber.MethodGet || status >= 500 || status == 401 || status == 403 || status == 429
}

// writeAuditRow enqueues the operational audit trail for this request onto the bounded worker pool.
func writeAuditRow(db *pgxpool.Pool, method, routePath string, status int, userID *string, ip, userAgent, logMessage, notifMessage string) {
	if db == nil || auditQueue == nil {
		return
	}

	job := auditJob{db, method, routePath, ip, userAgent, status, userID, logMessage, notifMessage}
	select {
	case auditQueue <- job:
	default:
		slog.Warn("audit queue full, dropping audit row", "method", method, "route", routePath)
	}
}

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
