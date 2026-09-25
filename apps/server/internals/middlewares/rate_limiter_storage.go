package middlewares

import (
	"context"
	"errors"
	"time"

	"github.com/redis/go-redis/v9"
)

// RedisStorage implements fiber.Storage backed by a shared Redis instance.
type RedisStorage struct {
	client *redis.Client
}

// NewRedisStorage wraps a Redis client for Fiber rate limiting storage.
func NewRedisStorage(client *redis.Client) *RedisStorage {
	return &RedisStorage{client: client}
}

func (s *RedisStorage) Get(key string) ([]byte, error) {
	if s.client == nil {
		return nil, nil
	}
	val, err := s.client.Get(context.Background(), key).Bytes()
	if errors.Is(err, redis.Nil) {
		return nil, nil
	}
	return val, err
}

func (s *RedisStorage) Set(key string, val []byte, exp time.Duration) error {
	if s.client == nil || key == "" || len(val) == 0 {
		return nil
	}
	return s.client.Set(context.Background(), key, val, exp).Err()
}

func (s *RedisStorage) Delete(key string) error {
	if s.client == nil {
		return nil
	}
	return s.client.Del(context.Background(), key).Err()
}

func (s *RedisStorage) Reset() error {
	return nil
}

func (s *RedisStorage) Close() error {
	return nil
}
