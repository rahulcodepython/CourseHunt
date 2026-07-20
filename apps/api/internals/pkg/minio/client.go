package minio

import (
	"context"
	"fmt"
	"time"

	"coursehunt/api/internals/config"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

// MinioStorage implements Storage interface using MinIO
type MinioStorage struct {
	client  *minio.Client
	bucket  string
	baseURL string
}

var MINIO *MinioStorage

// SetupMinio initializes MinIO client and ensures bucket exists
func SetupMinio(cfg *config.Config) error {

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

	ctx := context.Background()

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
