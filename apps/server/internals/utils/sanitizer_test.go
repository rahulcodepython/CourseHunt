package utils

import (
	"testing"
)

func TestSanitizeUGC(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "Removes script tags",
			input:    "Course intro <script>alert(1)</script> details",
			expected: "Course intro  details",
		},
		{
			name:     "Removes inline event handlers",
			input:    `<img src="thumb.jpg" onerror="alert('hack')">`,
			expected: `<img src="thumb.jpg">`,
		},
		{
			name:     "Preserves code syntax highlighting classes",
			input:    `<pre><code class="language-go">func main() {}</code></pre>`,
			expected: `<pre><code class="language-go">func main() {}</code></pre>`,
		},
		{
			name:     "Preserves markdown rich text formatting",
			input:    "<h3>Module 1</h3><p>Learn <strong>Go</strong> and <em>Next.js</em>.</p>",
			expected: "<h3>Module 1</h3><p>Learn <strong>Go</strong> and <em>Next.js</em>.</p>",
		},
		{
			name:     "Handles empty or whitespace string",
			input:    "   \n\t  ",
			expected: "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := SanitizeUGC(tt.input)
			if result != tt.expected {
				t.Fatalf("expected '%s', got '%s'", tt.expected, result)
			}
		})
	}
}

func TestSanitizeUGCPtr(t *testing.T) {
	// Nil pointer should return nil
	if SanitizeUGCPtr(nil) != nil {
		t.Fatalf("expected nil for nil input")
	}

	// Empty string pointer should return nil
	empty := ""
	if SanitizeUGCPtr(&empty) != nil {
		t.Fatalf("expected nil for empty string input")
	}

	// Malicious script pointer should return nil if string becomes empty
	malicious := "<script>alert(1)</script>"
	if SanitizeUGCPtr(&malicious) != nil {
		t.Fatalf("expected nil for string with only script tags")
	}

	// Valid content pointer should return sanitized pointer
	valid := "<b>Bold content</b>"
	res := SanitizeUGCPtr(&valid)
	if res == nil || *res != "<b>Bold content</b>" {
		t.Fatalf("expected '<b>Bold content</b>', got %v", res)
	}
}
