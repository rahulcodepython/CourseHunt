package minio

import (
	"context"
	"fmt"
	"log/slog"
	"net/url"
	"strings"

	"github.com/minio/minio-go/v7"
)

// CleanKey extracts the bucket-relative object key from a full URL or key string.
func (s *Storage) CleanKey(objectKey, baseURL string) string {
	key := objectKey
	if strings.HasPrefix(key, baseURL+"/") {
		key = strings.TrimPrefix(key, baseURL+"/")
	} else if u, err := url.Parse(key); err == nil && u.Path != "" {
		trimmed := strings.TrimPrefix(u.Path, "/")
		parts := strings.SplitN(trimmed, "/", 2)
		if len(parts) == 2 {
			key = parts[1]
		}
	}
	return key
}

// DeleteObject removes an object from the bucket.
func (s *Storage) DeleteObject(ctx context.Context, objectName string) error {
	if objectName == "" {
		return nil
	}
	s.mu.RLock()
	client, bucket := s.client, s.bucket
	s.mu.RUnlock()

	if client == nil {
		return fmt.Errorf("storage client is not initialized")
	}
	return client.RemoveObject(ctx, bucket, objectName, minio.RemoveObjectOptions{})
}

// ObjectNameFromURL extracts the bucket-relative object name from a URL
// previously handed out by GetPublicURL, or "" if the URL doesn't belong to
// this bucket.
func (s *Storage) ObjectNameFromURL(fileURL string) string {
	s.mu.RLock()
	baseURL := s.baseURL
	pubBaseURL := s.publicBaseURL
	s.mu.RUnlock()

	if fileURL == "" {
		return ""
	}

	if strings.HasPrefix(fileURL, baseURL+"/") {
		return strings.TrimPrefix(fileURL, baseURL+"/")
	}
	if pubBaseURL != "" && strings.HasPrefix(fileURL, pubBaseURL+"/") {
		return strings.TrimPrefix(fileURL, pubBaseURL+"/")
	}

	return s.CleanKey(fileURL, baseURL)
}

// DeleteIfReplaced deletes the object behind oldURL when a file field is
// being replaced or cleared (newURL differs from it).
func (s *Storage) DeleteIfReplaced(ctx context.Context, oldURL *string, newURL string) {
	if oldURL == nil || *oldURL == "" || *oldURL == newURL {
		return
	}
	objectName := s.ObjectNameFromURL(*oldURL)
	if objectName == "" {
		return
	}
	if err := s.DeleteObject(ctx, objectName); err != nil {
		slog.Error("failed to delete replaced minio object", "object", objectName, "error", err)
	}
}
