package minio

import (
	"context"
	"fmt"
	"net/url"
	"time"
)

// GeneratePresignedStreamingURL generates a short-lived presigned URL for private video streaming
// enforcing inline content disposition to support browser byte-range seek requests.
func (s *Storage) GeneratePresignedStreamingURL(ctx context.Context, objectKey string, expires time.Duration) (string, error) {
	s.mu.RLock()
	client := s.publicClient
	bucket := s.bucket
	baseURL := s.baseURL
	s.mu.RUnlock()

	if client == nil {
		return "", fmt.Errorf("storage client is not initialized")
	}

	key := s.CleanKey(objectKey, baseURL)
	if key == "" {
		return "", fmt.Errorf("empty object key")
	}

	if expires <= 0 {
		expires = 15 * time.Minute
	}

	reqParams := make(url.Values)
	// Enforce byte-range requests for seamless video seek operations
	reqParams.Set("response-content-disposition", "inline")

	u, err := client.PresignedGetObject(ctx, bucket, key, expires, reqParams)
	if err != nil {
		return "", fmt.Errorf("failed to generate secure streaming url: %w", err)
	}
	return u.String(), nil
}

// GeneratePresignedDownloadURL generates a secure download URL with attachment disposition.
func (s *Storage) GeneratePresignedDownloadURL(ctx context.Context, objectKey string, expires time.Duration) (string, error) {
	s.mu.RLock()
	client := s.publicClient
	bucket := s.bucket
	baseURL := s.baseURL
	s.mu.RUnlock()

	if client == nil {
		return "", fmt.Errorf("storage client is not initialized")
	}

	key := s.CleanKey(objectKey, baseURL)
	if key == "" {
		return "", fmt.Errorf("empty object key")
	}

	if expires <= 0 {
		expires = 15 * time.Minute
	}

	reqParams := make(url.Values)
	reqParams.Set("response-content-disposition", "attachment")

	u, err := client.PresignedGetObject(ctx, bucket, key, expires, reqParams)
	if err != nil {
		return "", fmt.Errorf("failed to generate secure download url: %w", err)
	}
	return u.String(), nil
}

// GetSignedUploadURL generates a signed PUT URL for uploading an object, valid for the specified duration.
func (s *Storage) GetSignedUploadURL(ctx context.Context, objectName string, expires time.Duration) (string, error) {
	s.mu.RLock()
	client := s.publicClient
	bucket := s.bucket
	s.mu.RUnlock()

	if client == nil {
		return "", fmt.Errorf("storage client is not initialized")
	}
	if objectName == "" {
		return "", fmt.Errorf("object name cannot be empty")
	}

	if expires <= 0 {
		expires = 15 * time.Minute
	}

	signedURL, err := client.PresignedPutObject(ctx, bucket, objectName, expires)
	if err != nil {
		return "", fmt.Errorf("failed to generate signed upload URL: %w", err)
	}

	return signedURL.String(), nil
}

// GetSignedURL generates a signed URL for uploading an object, valid for 15 minutes.
func (s *Storage) GetSignedURL(ctx context.Context, objectName string) (string, error) {
	return s.GetSignedUploadURL(ctx, objectName, 15*time.Minute)
}

// GetPublicURL returns the public URL for a given object name in the public bucket.
func (s *Storage) GetPublicURL(objectName string) string {
	s.mu.RLock()
	baseURL := s.publicBaseURL
	if baseURL == "" {
		baseURL = s.baseURL
	}
	s.mu.RUnlock()
	return fmt.Sprintf("%s/%s", baseURL, objectName)
}
