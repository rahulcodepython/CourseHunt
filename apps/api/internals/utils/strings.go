package utils

import (
	"fmt"
	"strings"
	"time"
)

// Slugify generates a URL-safe slug from a string.
func Slugify(title string) string {
	s := strings.ToLower(title)
	s = strings.ReplaceAll(s, " ", "-")
	// strip non alphanum/dash
	var b strings.Builder
	for _, r := range s {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') || r == '-' {
			b.WriteRune(r)
		}
	}
	slug := strings.Trim(b.String(), "-")
	// append timestamp suffix for uniqueness
	return fmt.Sprintf("%s-%d", slug, time.Now().UnixNano()%100000)
}
