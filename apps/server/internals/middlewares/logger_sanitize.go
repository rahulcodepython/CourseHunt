package middlewares

import (
	"bytes"
	"encoding/json"
	"strings"
)

const maxBodyLogLength = 2048

var sensitiveKeyPatterns = []string{"password", "secret", "token", "credit", "cvv", "card"}

// isSensitiveKey checks whether a key name indicates sensitive credential or card data.
func isSensitiveKey(k string) bool {
	kLower := strings.ToLower(k)
	for _, pattern := range sensitiveKeyPatterns {
		if strings.Contains(kLower, pattern) {
			return true
		}
	}
	return false
}

// sanitizeJSON recursively redacts sensitive fields in-place without duplicating untouched subtrees.
func sanitizeJSON(val interface{}) {
	switch v := val.(type) {
	case map[string]interface{}:
		for k, item := range v {
			if isSensitiveKey(k) {
				v[k] = "[REDACTED]"
			} else {
				sanitizeJSON(item)
			}
		}
	case []interface{}:
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
		var parsed interface{}
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
