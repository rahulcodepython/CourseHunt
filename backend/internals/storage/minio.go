package storage

import (
	"context"
	"fmt"
	"io"

	"coursehunt-backend/internals/config"

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
func SetupMinio() error {
	cfg := config.CFG

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

// UploadFile uploads a file to MinIO and returns its accessible URL
func (s *MinioStorage) UploadFile(ctx context.Context, objectName string, reader io.Reader, size int64, contentType string) (string, error) {
	if objectName == "" {
		return "", fmt.Errorf("object name cannot be empty")
	}
	if reader == nil {
		return "", fmt.Errorf("reader cannot be nil")
	}
	if size <= 0 {
		return "", fmt.Errorf("invalid file size")
	}
	if contentType == "" {
		return "", fmt.Errorf("content type cannot be empty")
	}

	_, err := s.client.PutObject(
		ctx,
		s.bucket,
		objectName,
		reader,
		size,
		minio.PutObjectOptions{ContentType: contentType},
	)
	if err != nil {
		return "", fmt.Errorf("failed to upload file: %w", err)
	}

	return fmt.Sprintf("%s/%s", s.baseURL, objectName), nil
}

// GetFile retrieves a file from MinIO
func (s *MinioStorage) GetFile(ctx context.Context, objectName string) (io.ReadCloser, error) {
	if objectName == "" {
		return nil, fmt.Errorf("object name cannot be empty")
	}

	object, err := s.client.GetObject(ctx, s.bucket, objectName, minio.GetObjectOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to get file: %w", err)
	}

	return object, nil
}
