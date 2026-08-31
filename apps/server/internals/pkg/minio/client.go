package minio

import (
	"context"
	"fmt"
	"log/slog"
	"net/url"
	"strings"
	"sync"
	"time"

	"coursehunt/server/internals/config"
	"coursehunt/server/internals/pkg/retry"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

// Storage implements object storage on top of MinIO. Callers get one
// instance from Connect and pass it into every feature that needs it
// (upload, courses, lessons) via constructor injection — there is no
// package-level singleton, so a feature's dependency on storage is visible
// in its constructor signature instead of a hidden global read.
type Storage struct {
	mu sync.RWMutex

	// client talks to MINIO_ENDPOINT — the internal/Docker-network address,
	// used for server-side operations (bucket setup, health checks).
	client *minio.Client
	// publicClient is signed for the host in MINIO_BASE_URL — the address a
	// browser can actually reach. The signed host is baked into a presigned
	// URL's AWS SigV4 signature, so it can't be swapped after the fact by
	// rewriting the URL string; it has to be signed for the right host from
	// the start.
	publicClient *minio.Client
	bucket       string
	baseURL      string

	cfg *config.Config // retained for Ping's auto-reconnect
}

// minioRegion is fixed rather than auto-discovered: without it, the SDK
// issues a live GetBucketLocation call the first time a client signs
// anything, using that client's own configured endpoint. publicClient is
// only ever reachable from the browser (that's the whole point of it), so
// from inside the server that lookup would fail outright — pinning the
// region up front means presigned-URL generation never needs network I/O.
const minioRegion = "us-east-1"

// publicReadPolicyTemplate allows anonymous GetObject so direct public URLs
// persisted in the DB (GetPublicURL) can be fetched by the browser without
// credentials. %s is substituted with the bucket name.
const publicReadPolicyTemplate = `{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"AWS":["*"]},"Action":["s3:GetObject"],"Resource":["arn:aws:s3:::%s/*"]}]}`

// Connect initializes the MinIO client with retries and ensures the bucket
// exists, returning a ready-to-use *Storage. Continuing without file
// storage on failure (if desired) is the caller's decision, same as today —
// this just returns the error instead of logging+swallowing it itself.
func Connect(cfg *config.Config) (*Storage, error) {
	s := &Storage{cfg: cfg}

	const maxAttempts = 5
	if err := retry.Connect("minio", maxAttempts, 1*time.Second, s.init); err != nil {
		return nil, fmt.Errorf("minio setup failed after %d retries: %w", maxAttempts, err)
	}

	slog.Info("connected to minio", "endpoint", cfg.MinioEnd, "bucket", cfg.MinioBucket)
	return s, nil
}

func (s *Storage) init() error {
	cfg := s.cfg
	if cfg.MinioEnd == "" || cfg.MinioAccess == "" || cfg.MinioSecret == "" || cfg.MinioBucket == "" {
		return fmt.Errorf("minio config is invalid")
	}

	client, err := minio.New(cfg.MinioEnd, &minio.Options{
		Creds:  credentials.NewStaticV4(cfg.MinioAccess, cfg.MinioSecret, ""),
		Secure: cfg.MinioSecure,
		Region: minioRegion,
	})
	if err != nil {
		return fmt.Errorf("failed to initialize minio client: %w", err)
	}

	publicEndpoint, publicSecure := publicEndpointFrom(cfg.MinioBaseURL, cfg.MinioEnd, cfg.MinioSecure)
	publicClient, err := minio.New(publicEndpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(cfg.MinioAccess, cfg.MinioSecret, ""),
		Secure: publicSecure,
		Region: minioRegion,
	})
	if err != nil {
		return fmt.Errorf("failed to initialize public minio client: %w", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	exists, err := client.BucketExists(ctx, cfg.MinioBucket)
	if err != nil {
		return fmt.Errorf("failed to check bucket existence: %w", err)
	}

	if !exists {
		if err := client.MakeBucket(ctx, cfg.MinioBucket, minio.MakeBucketOptions{}); err != nil {
			return fmt.Errorf("failed to create bucket: %w", err)
		}
	}

	// The app persists GetPublicURL (base URL + object name) in the DB for
	// images/videos and the browser fetches those directly, so the bucket must
	// allow anonymous reads. Uploads still go through presigned PUT URLs.
	if err := client.SetBucketPolicy(ctx, cfg.MinioBucket, fmt.Sprintf(publicReadPolicyTemplate, cfg.MinioBucket)); err != nil {
		return fmt.Errorf("failed to set public-read policy: %w", err)
	}

	s.mu.Lock()
	s.client = client
	s.publicClient = publicClient
	s.bucket = cfg.MinioBucket
	s.baseURL = cfg.MinioBaseURL
	s.mu.Unlock()

	return nil
}

// publicEndpointFrom derives the browser-reachable host:port (and whether
// it's https) from MINIO_BASE_URL, falling back to the internal endpoint if
// the base URL can't be parsed.
func publicEndpointFrom(baseURL, fallbackEndpoint string, fallbackSecure bool) (string, bool) {
	u, err := url.Parse(baseURL)
	if err != nil || u.Host == "" {
		return fallbackEndpoint, fallbackSecure
	}
	return u.Host, u.Scheme == "https"
}

// Ping checks health status of the MinIO connection, attempting
// auto-reconnect if needed.
func (s *Storage) Ping(ctx context.Context) error {
	s.mu.RLock()
	client, bucket := s.client, s.bucket
	s.mu.RUnlock()

	if client == nil {
		if err := s.init(); err != nil {
			return fmt.Errorf("minio auto-reconnect failed: %w", err)
		}
		s.mu.RLock()
		client, bucket = s.client, s.bucket
		s.mu.RUnlock()
	}

	_, err := client.BucketExists(ctx, bucket)
	if err != nil {
		// Attempt re-init once if bucket ping fails.
		if reinitErr := s.init(); reinitErr == nil {
			s.mu.RLock()
			client, bucket = s.client, s.bucket
			s.mu.RUnlock()
			_, err = client.BucketExists(ctx, bucket)
		}
	}

	if err != nil {
		return fmt.Errorf("minio bucket check failed: %w", err)
	}
	return nil
}

// GetSignedURL generates a signed URL for uploading an object, valid for 1 hour
func (s *Storage) GetSignedURL(ctx context.Context, objectName string) (string, error) {
	if objectName == "" {
		return "", fmt.Errorf("object name cannot be empty")
	}

	expiry := time.Hour
	signedURL, err := s.publicClient.PresignedPutObject(ctx, s.bucket, objectName, expiry)
	if err != nil {
		return "", fmt.Errorf("failed to generate signed URL: %w", err)
	}

	return signedURL.String(), nil
}

// GetPublicURL returns the public URL for a given object name
func (s *Storage) GetPublicURL(objectName string) string {
	return fmt.Sprintf("%s/%s", s.baseURL, objectName)
}

// DeleteObject removes an object from the bucket. A no-op (not an error) for
// an empty object name, so callers can pass through an "absent" value freely.
func (s *Storage) DeleteObject(ctx context.Context, objectName string) error {
	if objectName == "" {
		return nil
	}
	return s.client.RemoveObject(ctx, s.bucket, objectName, minio.RemoveObjectOptions{})
}

// ObjectNameFromURL extracts the bucket-relative object name from a URL
// previously handed out by GetPublicURL, or "" if the URL doesn't belong to
// this bucket (e.g. empty, or an external URL that predates this storage).
func (s *Storage) ObjectNameFromURL(fileURL string) string {
	prefix := s.baseURL + "/"
	if fileURL == "" || !strings.HasPrefix(fileURL, prefix) {
		return ""
	}
	return strings.TrimPrefix(fileURL, prefix)
}

// DeleteIfReplaced deletes the object behind oldURL when a file field is
// being replaced or cleared (newURL differs from it) — otherwise a stale
// object is left behind in the bucket every time a course/lesson file is
// swapped. Best-effort: storage errors are logged, not returned, since the
// DB write this follows has already succeeded and shouldn't be undone over a
// secondary cleanup failure.
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
