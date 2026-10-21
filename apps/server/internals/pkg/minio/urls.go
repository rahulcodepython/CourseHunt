package minio

import (
	"context"
	"fmt"
	"net/url"
	"time"
)

// GeneratePresignedStreamingURL generates a short-lived presigned URL for private video streaming
// enforcing inline content disposition to support browser byte-range seek requests.
func (s *Storage) GeneratePresignedStreamingURL(ctx context.Context, objectURL string, expires time.Duration) (string, error) {
	return s.presignGet(ctx, objectURL, expires, "inline")
}

// GeneratePresignedDownloadURL generates a secure download URL with attachment disposition.
func (s *Storage) GeneratePresignedDownloadURL(ctx context.Context, objectURL string, expires time.Duration) (string, error) {
	return s.presignGet(ctx, objectURL, expires, "attachment")
}

// presignGet signs a GET for objects in the private bucket. Public-bucket and
// external URLs are already fetchable by the browser, so they are returned
// as-is.
func (s *Storage) presignGet(ctx context.Context, objectURL string, expires time.Duration, disposition string) (string, error) {
	if s == nil {
		return objectURL, nil
	}
	s.mu.RLock()
	client := s.publicClient
	privBucket := s.bucket
	s.mu.RUnlock()

	if client == nil {
		return "", fmt.Errorf("storage client is not initialized")
	}

	bucket, key := s.resolve(objectURL)
	if key == "" {
		return objectURL, nil
	}
	if bucket != privBucket {
		return s.objectURL(bucket, key), nil
	}

	if expires <= 0 {
		expires = 15 * time.Minute
	}

	reqParams := make(url.Values)
	reqParams.Set("response-content-disposition", disposition)

	u, err := client.PresignedGetObject(ctx, bucket, key, expires, reqParams)
	if err != nil {
		return "", fmt.Errorf("failed to generate presigned url: %w", err)
	}
	return u.String(), nil
}

// GetSignedUploadURL generates a signed PUT URL for uploading an object to the
// public or private bucket, valid for the specified duration.
func (s *Storage) GetSignedUploadURL(ctx context.Context, objectName string, public bool, expires time.Duration) (string, error) {
	if s == nil {
		return "", ErrDisabled
	}
	s.mu.RLock()
	client := s.publicClient
	bucket := s.bucket
	if public {
		bucket = s.publicBucket
	}
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

// ObjectURL returns the URL persisted in the DB for an uploaded object. Public
// objects get their browser-fetchable URL on MINIO_PUBLIC_BASE_URL; private
// objects get a MINIO_BASE_URL reference that is only usable once presigned.
func (s *Storage) ObjectURL(objectName string, public bool) string {
	if s == nil {
		return ""
	}
	s.mu.RLock()
	bucket := s.bucket
	if public {
		bucket = s.publicBucket
	}
	s.mu.RUnlock()
	return s.objectURL(bucket, objectName)
}

func (s *Storage) objectURL(bucket, key string) string {
	s.mu.RLock()
	baseURL := s.baseURL
	if bucket == s.publicBucket && s.publicBaseURL != "" {
		baseURL = s.publicBaseURL
	}
	s.mu.RUnlock()
	return fmt.Sprintf("%s/%s", baseURL, key)
}
