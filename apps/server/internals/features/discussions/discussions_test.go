package discussions

import (
	"testing"

	"coursehunt/server/internals/utils"
)

func TestHTMLSanitization(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "XSS Script tag removal",
			input:    "Hello <script>alert('pwned')</script> World",
			expected: "Hello  World",
		},
		{
			name:     "XSS onload handler removal",
			input:    `<img src="x" onerror="alert(1)">`,
			expected: `<img src="x">`,
		},
		{
			name:     "Safe markup preservation",
			input:    "<p>This is a <strong>bold</strong> statement.</p>",
			expected: "<p>This is a <strong>bold</strong> statement.</p>",
		},
		{
			name:     "Only script tags results in empty trimmed string",
			input:    "<script>alert(1)</script>",
			expected: "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			sanitized := utils.SanitizeUGC(tt.input)
			if sanitized != tt.expected {
				t.Fatalf("expected '%s', got '%s'", tt.expected, sanitized)
			}
		})
	}
}
