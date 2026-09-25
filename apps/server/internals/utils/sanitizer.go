package utils

import (
	"regexp"
	"strings"
	"sync"

	"github.com/microcosm-cc/bluemonday"
)

var (
	ugcPolicy     *bluemonday.Policy
	ugcPolicyOnce sync.Once
	syntaxClassRx = regexp.MustCompile(`^language-[a-zA-Z0-9_\-]+$`)
)

// getUGCPolicy returns a singleton bluemonday UGC (User Generated Content) policy.
// It allows safe rich-text formatting (paragraphs, headers, blockquotes, lists, code blocks, tables,
// safe links, images) while aggressively stripping executable scripts, event handlers, and malicious URIs.
func getUGCPolicy() *bluemonday.Policy {
	ugcPolicyOnce.Do(func() {
		p := bluemonday.UGCPolicy()
		// Allow safe code block syntax highlighting classes (e.g. language-go, language-js)
		p.AllowAttrs("class").Matching(syntaxClassRx).OnElements("code", "pre", "span")
		ugcPolicy = p
	})
	return ugcPolicy
}

// SanitizeUGC sanitizes user-generated rich text and markdown content.
func SanitizeUGC(input string) string {
	if strings.TrimSpace(input) == "" {
		return ""
	}
	return strings.TrimSpace(getUGCPolicy().Sanitize(input))
}

// SanitizeUGCPtr sanitizes an optional string pointer.
// If input is nil, it returns nil. If the sanitized result is empty, it returns nil.
func SanitizeUGCPtr(input *string) *string {
	if input == nil {
		return nil
	}
	sanitized := SanitizeUGC(*input)
	if sanitized == "" {
		return nil
	}
	return &sanitized
}

// SanitizeMarkdown is a semantic alias for SanitizeUGC.
func SanitizeMarkdown(input string) string {
	return SanitizeUGC(input)
}

// SanitizeMarkdownPtr is a semantic alias for SanitizeUGCPtr.
func SanitizeMarkdownPtr(input *string) *string {
	return SanitizeUGCPtr(input)
}
