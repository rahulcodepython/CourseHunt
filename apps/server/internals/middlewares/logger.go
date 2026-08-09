package middlewares

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"coursehunt/server/internals/generic"

	"github.com/gofiber/fiber/v2"
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

func LoggerMiddleware() fiber.Handler {
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

		// Check if this request represents an error (status >= 400 or has error attached)
		if status >= 400 || handlerErr != nil {
			routePath := "-"
			if r := c.Route(); r != nil {
				routePath = r.Path
			}

			// User & Caller context
			userInfo := "Anonymous / Unauthenticated"
			if u, ok := c.Locals("user").(*generic.UserContext); ok && u != nil {
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
		} else {
			// Standard info log for healthy 2xx/3xx requests
			log.Printf("[INFO] %s %s | Status: %d | Latency: %v | IP: %s",
				c.Method(), c.OriginalURL(), status, latency, c.IP())
		}

		return err
	}
}
