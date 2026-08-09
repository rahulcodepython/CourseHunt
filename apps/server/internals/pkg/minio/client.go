package minio

import (
	"context"
	"fmt"
	"log"
	"sync"
	"time"

	"coursehunt/server/internals/config"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

// MinioStorage implements Storage interface using MinIO
type MinioStorage struct {
	client  *minio.Client
	bucket  string
	baseURL string
}

var (
	MINIO    *MinioStorage
	savedCfg *config.Config
	mu       sync.RWMutex
)

func initMinio(cfg *config.Config) error {
	if cfg.MinioEnd == "" || cfg.MinioAccess == "" || cfg.MinioSecret == "" || cfg.MinioBucket == "" {
		return fmt.Errorf("minio config is invalid")
	}

	client, err := minio.New(cfg.MinioEnd, &minio.Options{
		Creds:  credentials.NewStaticV4(cfg.MinioAccess, cfg.MinioSecret, ""),
		Secure: cfg.MinioSecure,
	})
	if err != nil {
		return fmt.Errorf("failed to initialize minio client: %w", err)
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

	MINIO = &MinioStorage{
		client:  client,
		bucket:  cfg.MinioBucket,
		baseURL: cfg.MinioBaseURL,
	}

	return nil
}

// SetupMinio initializes MinIO client with retries and ensures bucket exists
func SetupMinio(cfg *config.Config) error {
	mu.Lock()
	defer mu.Unlock()

	savedCfg = cfg

	maxRetries := 5
	var lastErr error
	for i := 1; i <= maxRetries; i++ {
		err := initMinio(cfg)
		if err == nil {
			log.Printf("[minio] Connected successfully to MinIO at %s (bucket: %s)", cfg.MinioEnd, cfg.MinioBucket)
			return nil
		}
		lastErr = err
		log.Printf("[minio] Connection attempt %d/%d failed: %v. Retrying in 1s...", i, maxRetries, err)
		time.Sleep(1 * time.Second)
	}

	return fmt.Errorf("minio setup failed after %d retries: %w", maxRetries, lastErr)
}

// Ping checks health status of MinIO connection, attempting auto-reconnect if needed
func Ping(ctx context.Context) error {
	mu.Lock()
	defer mu.Unlock()

	if MINIO == nil || MINIO.client == nil {
		if savedCfg != nil {
			if err := initMinio(savedCfg); err != nil {
				return fmt.Errorf("minio auto-reconnect failed: %w", err)
			}
		} else {
			return fmt.Errorf("minio storage is not initialized and no config available")
		}
	}

	_, err := MINIO.client.BucketExists(ctx, MINIO.bucket)
	if err != nil {
		// Attempt re-init once if bucket ping fails
		if savedCfg != nil {
			if reinitErr := initMinio(savedCfg); reinitErr == nil {
				_, err = MINIO.client.BucketExists(ctx, MINIO.bucket)
			}
		}
	}

	if err != nil {
		return fmt.Errorf("minio bucket check failed: %w", err)
	}
	return nil
}

// GetSignedURL generates a signed URL for uploading an object, valid for 1 hour
func (s *MinioStorage) GetSignedURL(ctx context.Context, objectName string) (string, error) {
	if objectName == "" {
		return "", fmt.Errorf("object name cannot be empty")
	}

	expiry := time.Hour
	url, err := s.client.PresignedPutObject(ctx, s.bucket, objectName, expiry)
	if err != nil {
		return "", fmt.Errorf("failed to generate signed URL: %w", err)
	}

	return url.String(), nil
}

// GetPublicURL returns the public URL for a given object name
func (s *MinioStorage) GetPublicURL(objectName string) string {
	return fmt.Sprintf("%s/%s", s.baseURL, objectName)
}
