package middlewares

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
)

// sanitizeJSON recursively redacts sensitive fields from JSON payloads
func sanitizeJSON(val interface{}) interface{} {
	switch v := val.(type) {
	case map[string]interface{}:
		sanitized := make(map[string]interface{})
		for k, item := range v {
			lowerKey := strings.ToLower(k)
			if strings.Contains(lowerKey, "password") ||
				strings.Contains(lowerKey, "secret") ||
				strings.Contains(lowerKey, "token") ||
				strings.Contains(lowerKey, "credit") ||
				strings.Contains(lowerKey, "cvv") ||
				strings.Contains(lowerKey, "card") {
				sanitized[k] = "[REDACTED]"
			} else {
				sanitized[k] = sanitizeJSON(item)
			}
		}
		return sanitized
	case []interface{}:
		sanitized := make([]interface{}, len(v))
		for i, item := range v {
			sanitized[i] = sanitizeJSON(item)
		}
		return sanitized
	default:
		return val
	}
}

// sanitizeRequestBody returns a sanitized string representation of the request body
func sanitizeRequestBody(body []byte) string {
	if len(body) == 0 {
		return "{}"
	}
	var parsed interface{}
	if err := json.Unmarshal(body, &parsed); err == nil {
		sanitized := sanitizeJSON(parsed)
		if out, err := json.Marshal(sanitized); err == nil {
			if len(out) > 2048 {
				return string(out[:2048]) + "... [TRUNCATED]"
			}
			return string(out)
		}
	}
	bodyStr := string(body)
	if len(bodyStr) > 2048 {
		bodyStr = bodyStr[:2048] + "... [TRUNCATED]"
	}
	return bodyStr
}

// writeAuditRow persists the operational audit trail for this request in one
// round trip: a `logs` row for any non-GET request, an admin-facing
// `notifications` row for a 5xx ("system issue"), and a `security_events`
// row for a 401/403/429 — three independently WHERE-gated CTEs in a single
// INSERT statement, so a request that's none of these (a GET that succeeded)
// costs nothing beyond the query round trip itself. Runs in a goroutine so a
// slow/unavailable DB never adds latency to the actual response.
func writeAuditRow(db *pgxpool.Pool, method, routePath string, status int, userID *string, ip, userAgent, logMessage, notifMessage string) {
	if db == nil {
		return
	}
	go func() {
		_, err := db.Exec(context.Background(), `
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
		`, logMessage, status < 400, userID, method != fiber.MethodGet, notifMessage, status, ip, userAgent, routePath)
		if err != nil {
			log.Printf("[LoggerMiddleware] audit insert failed: %v", err)
		}
	}()
}

func LoggerMiddleware(db *pgxpool.Pool) fiber.Handler {
	return func(c *fiber.Ctx) error {
		start := time.Now()

		// Capture request body BEFORE handler execution
		reqBodyBytes := c.Body()

		// Proceed with request pipeline
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

		var actorUserID *string
		userInfo := "Anonymous / Unauthenticated"
		if u, err := UserFromContext(c); err == nil && u != nil {
			actorUserID = &u.UserID
			userInfo = fmt.Sprintf("UserID: %s | Roles: %v", u.UserID, u.Roles)
		}

		// Check if this request represents an error (status >= 400 or has error attached)
		if status >= 400 || handlerErr != nil {
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

			// Request Parameters
			queryParams := c.Queries()
			pathParams := c.AllParams()

			// Format parameters JSON
			queryStr := "{}"
			if len(queryParams) > 0 {
				if qBytes, e := json.Marshal(queryParams); e == nil {
					queryStr = string(qBytes)
				}
			}
			pathStr := "{}"
			if len(pathParams) > 0 {
				if pBytes, e := json.Marshal(pathParams); e == nil {
					pathStr = string(pBytes)
				}
			}

			// Sanitized Body
			sanitizedBody := sanitizeRequestBody(reqBodyBytes)

			// High-visibility Error Log Output
			log.Printf("\n================================================================================\n"+
				"🚨 [ERROR ALERT] API Failure Detected\n"+
				"--------------------------------------------------------------------------------\n"+
				"📍 Endpoint:      %s %s (Route Pattern: %s)\n"+
				"❌ Status Code:   %d %s\n"+
				"💥 Error Reason:  %s\n"+
				"👤 User Context:  %s\n"+
				"🌐 Client IP:     %s (X-Forwarded-For: %s)\n"+
				"💻 User-Agent:    %s\n"+
				"🔍 Referer:       %s | Origin: %s\n"+
				"❓ Query Params:  %s\n"+
				"📌 Path Params:   %s\n"+
				"📦 Request Body:  %s\n"+
				"⏱️  Latency:       %v\n"+
				"================================================================================",
				c.Method(), c.OriginalURL(), routePath,
				status, http.StatusText(status),
				errDetail,
				userInfo,
				c.IP(), c.Get("X-Forwarded-For", "-"),
				c.Get("User-Agent", "-"),
				c.Get("Referer", "-"), c.Get("Origin", "-"),
				queryStr,
				pathStr,
				sanitizedBody,
				latency,
			)

			logMessage := fmt.Sprintf("%s %s → %d %s", c.Method(), routePath, status, http.StatusText(status))
			notifMessage := fmt.Sprintf("System error on %s %s: %s", c.Method(), routePath, errDetail)
			writeAuditRow(db, c.Method(), routePath, status, actorUserID, c.IP(), c.Get("User-Agent", "-"), logMessage, notifMessage)
		} else {
			// Standard info log for healthy 2xx/3xx requests
			log.Printf("[INFO] %s %s | Status: %d | Latency: %v | IP: %s",
				c.Method(), c.OriginalURL(), status, latency, c.IP())

			logMessage := fmt.Sprintf("%s %s → %d %s", c.Method(), routePath, status, http.StatusText(status))
			writeAuditRow(db, c.Method(), routePath, status, actorUserID, c.IP(), c.Get("User-Agent", "-"), logMessage, "")
		}

		return err
	}
}
