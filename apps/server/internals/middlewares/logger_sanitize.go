package middlewares

import (
	"bytes"
	"encoding/json"
	"strings"
)

const maxBodyLogLength = 2048

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
