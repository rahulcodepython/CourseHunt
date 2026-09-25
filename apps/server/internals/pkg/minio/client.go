package minio

import (
	"context"
	"fmt"
	"log/slog"
	"net/url"
	"sync"
	"time"

	"coursehunt/server/internals/config"
	"coursehunt/server/internals/pkg/retry"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

// Storage implements object storage on top of MinIO. Callers get one
// instance from Connect and pass it into every feature that needs it
// (upload, courses, lessons) via constructor injection.
type Storage struct {
	mu sync.RWMutex

	// client talks to MINIO_ENDPOINT — the internal/Docker-network address,
	// used for server-side operations (bucket setup, health checks).
	client *minio.Client
	// publicClient is signed for the host in MINIO_BASE_URL — the address a
	// browser can actually reach.
	publicClient  *minio.Client
	bucket        string // Private bucket (coursehunt-private)
	baseURL       string
	publicBucket  string // Public bucket (coursehunt-public)
	publicBaseURL string

	cfg *config.Config // retained for Ping's auto-reconnect
}

// minioRegion is fixed rather than auto-discovered: without it, the SDK
// issues a live GetBucketLocation call the first time a client signs
// anything, using that client's own configured endpoint. publicClient is
// only ever reachable from the browser, so region pinning prevents network I/O.
const minioRegion = "us-east-1"

// publicReadPolicyTemplate allows anonymous GetObject so direct public URLs
// persisted in the DB (GetPublicURL) can be fetched by the browser without credentials.
const publicReadPolicyTemplate = `{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"AWS":["*"]},"Action":["s3:GetObject"],"Resource":["arn:aws:s3:::%s/*"]}]}`

// Connect initializes the MinIO client with retries and ensures both private
// and public buckets exist, returning a ready-to-use *Storage.
func Connect(cfg *config.Config) (*Storage, error) {
	s := &Storage{cfg: cfg}

	const maxAttempts = 5
	if err := retry.Connect("minio", maxAttempts, 1*time.Second, s.init); err != nil {
		return nil, fmt.Errorf("minio setup failed after %d retries: %w", maxAttempts, err)
	}

	slog.Info("connected to minio", "endpoint", cfg.MinioEnd, "private_bucket", cfg.MinioBucket, "public_bucket", cfg.MinioPublicBucket)
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

	// 1. Private bucket setup (no public policy applied — strictly private access)
	exists, err := client.BucketExists(ctx, cfg.MinioBucket)
	if err != nil {
		return fmt.Errorf("failed to check private bucket existence: %w", err)
	}
	if !exists {
		if err := client.MakeBucket(ctx, cfg.MinioBucket, minio.MakeBucketOptions{}); err != nil {
			return fmt.Errorf("failed to create private bucket: %w", err)
		}
	}

	// 2. Public bucket setup (for thumbnails, public avatars, banners)
	publicBucket := cfg.MinioPublicBucket
	if publicBucket == "" {
		publicBucket = "coursehunt-public"
	}
	pubExists, err := client.BucketExists(ctx, publicBucket)
	if err != nil {
		return fmt.Errorf("failed to check public bucket existence: %w", err)
	}
	if !pubExists {
		if err := client.MakeBucket(ctx, publicBucket, minio.MakeBucketOptions{}); err != nil {
			return fmt.Errorf("failed to create public bucket: %w", err)
		}
	}

	// Apply public-read policy ONLY to the public bucket
	if err := client.SetBucketPolicy(ctx, publicBucket, fmt.Sprintf(publicReadPolicyTemplate, publicBucket)); err != nil {
		slog.Warn("failed to set public-read policy on public bucket", "bucket", publicBucket, "err", err)
	}

	pubBaseURL := cfg.MinioPublicBaseURL
	if pubBaseURL == "" {
		pubBaseURL = cfg.MinioBaseURL
	}

	s.mu.Lock()
	s.client = client
	s.publicClient = publicClient
	s.bucket = cfg.MinioBucket
	s.baseURL = cfg.MinioBaseURL
	s.publicBucket = publicBucket
	s.publicBaseURL = pubBaseURL
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

// Ping checks health status of the MinIO connection, attempting auto-reconnect if needed.
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
