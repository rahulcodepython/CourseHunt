package minio

import (
	"context"
	"fmt"
	"log/slog"
	"net/url"
	"strings"

	"github.com/minio/minio-go/v7"
)

// resolve maps a stored object URL, a presigned URL, or a bare key to the
// bucket and key it refers to. Stored URLs are built from MINIO_PUBLIC_BASE_URL
// or MINIO_BASE_URL (see ObjectURL); presigned URLs are path-style
// (<host>/<bucket>/<key>?X-Amz-...). It returns an empty key for URLs that
// don't belong to either bucket (e.g. an external image link), which callers
// must leave untouched.
func (s *Storage) resolve(raw string) (bucket, key string) {
	if s == nil {
		return "", ""
	}
	s.mu.RLock()
	privBucket, privBase := s.bucket, s.baseURL
	pubBucket, pubBase := s.publicBucket, s.publicBaseURL
	s.mu.RUnlock()

	if raw == "" {
		return "", ""
	}

	u, err := url.Parse(raw)
	if err != nil {
		return "", ""
	}
	if u.Host == "" {
		// Bare object key — private bucket by default.
		return privBucket, strings.TrimPrefix(u.Path, "/")
	}

	// Drop the presign query string so presigned and stored URLs compare equal.
	plain := u.Scheme + "://" + u.Host + u.EscapedPath()
	if pubBase != "" && strings.HasPrefix(plain, pubBase+"/") {
		return pubBucket, unescape(strings.TrimPrefix(plain, pubBase+"/"))
	}
	if privBase != "" && strings.HasPrefix(plain, privBase+"/") {
		return privBucket, unescape(strings.TrimPrefix(plain, privBase+"/"))
	}

	// Path-style fallback: /<bucket>/<key> on any host this storage signs for.
	parts := strings.SplitN(strings.TrimPrefix(u.Path, "/"), "/", 2)
	if len(parts) == 2 && parts[1] != "" && (parts[0] == privBucket || parts[0] == pubBucket) {
		return parts[0], parts[1]
	}

	return "", ""
}

func unescape(p string) string {
	if v, err := url.PathUnescape(p); err == nil {
		return v
	}
	return p
}

// CanonicalURL normalises a client-supplied media URL before it is persisted.
// Edit forms are pre-filled with presigned URLs, so they post those back on
// save; storing one would leave an expiring link in the DB and make
// DeleteIfReplaced delete the very object it still points at. URLs outside
// our buckets are returned unchanged.
func (s *Storage) CanonicalURL(raw string) string {
	bucket, key := s.resolve(raw)
	if key == "" {
		return raw
	}
	return s.objectURL(bucket, key)
}

// CanonicalURLPtr is CanonicalURL for optional request fields.
func (s *Storage) CanonicalURLPtr(raw *string) *string {
	if raw == nil {
		return nil
	}
	v := s.CanonicalURL(*raw)
	return &v
}

func (s *Storage) deleteObject(ctx context.Context, bucket, key string) error {
	if s == nil {
		return ErrDisabled
	}
	s.mu.RLock()
	client := s.client
	s.mu.RUnlock()

	if client == nil {
		return fmt.Errorf("storage client is not initialized")
	}
	return client.RemoveObject(ctx, bucket, key, minio.RemoveObjectOptions{})
}

// DeleteIfReplaced deletes the object behind oldURL when a file field is
// being replaced or cleared (newURL refers to a different object).
func (s *Storage) DeleteIfReplaced(ctx context.Context, oldURL *string, newURL string) {
	if s == nil || oldURL == nil || *oldURL == "" {
		return
	}
	bucket, key := s.resolve(*oldURL)
	if key == "" {
		return
	}
	if newBucket, newKey := s.resolve(newURL); newBucket == bucket && newKey == key {
		return
	}
	if err := s.deleteObject(ctx, bucket, key); err != nil {
		slog.Error("failed to delete replaced storage object", "bucket", bucket, "object", key, "error", err)
	}
}
