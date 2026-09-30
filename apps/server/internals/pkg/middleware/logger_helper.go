package middleware

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
)

// ProcessAPILog processes metrics, error details, structured logging, and audit persistence.
func ProcessAPILog(c *fiber.Ctx, db *pgxpool.Pool, latency time.Duration, status int, err error) {
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
		var actorUserID *string
		userInfo := "Anonymous / Unauthenticated"
		if u, uErr := UserFromContext(c); uErr == nil && u != nil {
			actorUserID = &u.UserID
			userInfo = fmt.Sprintf("UserID: %s | Roles: %v", u.UserID, u.Roles)
		}

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

		sanitizedBody := SanitizeRequestBody(c.Body())

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

		if ShouldAudit(c.Method(), status) {
			logMessage := fmt.Sprintf("%s %s → %d %s", c.Method(), routePath, status, http.StatusText(status))
			notifMessage := fmt.Sprintf("System error on %s %s: %s", c.Method(), routePath, errDetail)
			WriteAuditRow(db, c.Method(), routePath, status, actorUserID, c.IP(), c.Get("User-Agent", "-"), logMessage, notifMessage)
		}
	} else {
		slog.Info("api request",
			"method", c.Method(), "url", c.OriginalURL(), "status", status,
			"latency_ms", latency.Milliseconds(), "ip", c.IP())

		if ShouldAudit(c.Method(), status) {
			var actorUserID *string
			if u, uErr := UserFromContext(c); uErr == nil && u != nil {
				actorUserID = &u.UserID
			}
			logMessage := fmt.Sprintf("%s %s → %d %s", c.Method(), routePath, status, http.StatusText(status))
			WriteAuditRow(db, c.Method(), routePath, status, actorUserID, c.IP(), c.Get("User-Agent", "-"), logMessage, "")
		}
	}
}
