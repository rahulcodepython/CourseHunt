package upload

import (
	"context"
	"testing"

	"coursehunt/server/internals/generic"
)

func TestSanitizeFileName(t *testing.T) {
	tests := []struct {
		name      string
		fileName  string
		expectErr bool
	}{
		{"Valid mp4", "intro.mp4", false},
		{"Valid png", "banner.png", false},
		{"Empty filename", "", true},
		{"Disallowed extension", "malware.exe", true},
		{"Path traversal", "../../etc/passwd", true},
		{"Path slash", "/root/file.mp4", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			clean, err := sanitizeFileName(tt.fileName)
			if tt.expectErr && err == nil {
				t.Fatalf("expected error for %s, got nil (clean: %s)", tt.fileName, clean)
			}
			if !tt.expectErr && err != nil {
				t.Fatalf("unexpected error for %s: %v", tt.fileName, err)
			}
		})
	}
}

func TestGetSignedURL_RoleEnforcement(t *testing.T) {
	app := &App{}

	// Student/User role should be rejected
	_, err := app.GetSignedURL(context.Background(), "user-123", generic.RoleUser, "video.mp4")
	if err == nil {
		t.Fatalf("expected forbidden error for student upload attempt, got nil")
	}
}
