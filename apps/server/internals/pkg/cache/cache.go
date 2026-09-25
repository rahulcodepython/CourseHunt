package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"time"

	"github.com/redis/go-redis/v9"
)

// Cache wraps the Redis client and exposes caching, querying, and invalidation operations.
type Cache struct {
	client *redis.Client
}

// NewCache initializes a new Cache instance with the provided Redis client.
func NewCache(client *redis.Client) *Cache {
	return &Cache{client: client}
}

// Ping checks the health status of the Redis connection.
func (c *Cache) Ping(ctx context.Context) error {
	if c == nil || c.client == nil {
		return fmt.Errorf("redis cache client not initialized")
	}
	return c.client.Ping(ctx).Err()
}

// Client returns the underlying Redis client instance.
func (c *Cache) Client() *redis.Client {
	if c == nil {
		return nil
	}
	return c.client
}

// Get fetches data from Redis and unmarshals it into dest.
func (c *Cache) Get(ctx context.Context, key string, dest interface{}) (bool, error) {
	if c == nil || c.client == nil {
		return false, nil
	}
	val, err := c.client.Get(ctx, key).Result()
	if err == redis.Nil {
		return false, nil
	} else if err != nil {
		slog.Error("cache get error", "key", key, "error", err)
		return false, nil
	}
	if err := json.Unmarshal([]byte(val), dest); err != nil {
		slog.Error("cache json unmarshal error", "key", key, "error", err)
		return false, nil
	}
	return true, nil
}

// Set marshals value into JSON and stores it in Redis with the given TTL.
func (c *Cache) Set(ctx context.Context, key string, val interface{}, ttl time.Duration) error {
	if c == nil || c.client == nil {
		return nil
	}
	data, err := json.Marshal(val)
	if err != nil {
		slog.Error("cache json marshal error", "key", key, "error", err)
		return err
	}
	if err := c.client.Set(ctx, key, data, ttl).Err(); err != nil {
		slog.Error("cache set error", "key", key, "error", err)
		return nil
	}
	return nil
}

// Delete removes specific keys from Redis.
func (c *Cache) Delete(ctx context.Context, keys ...string) error {
	if c == nil || c.client == nil || len(keys) == 0 {
		return nil
	}
	if err := c.client.Del(ctx, keys...).Err(); err != nil {
		slog.Error("cache delete error", "error", err)
	}
	return nil
}

// DeleteByPattern scans for matching keys and deletes them.
func (c *Cache) DeleteByPattern(ctx context.Context, pattern string) error {
	if c == nil || c.client == nil {
		return nil
	}
	var cursor uint64
	var keys []string
	for {
		var err error
		var k []string
		k, cursor, err = c.client.Scan(ctx, cursor, pattern, 100).Result()
		if err != nil {
			slog.Error("cache delete-by-pattern scan error", "pattern", pattern, "error", err)
			return nil
		}
		keys = append(keys, k...)
		if cursor == 0 {
			break
		}
	}
	if len(keys) > 0 {
		if err := c.client.Del(ctx, keys...).Err(); err != nil {
			slog.Error("cache delete-by-pattern delete error", "pattern", pattern, "error", err)
		}
	}
	return nil
}

// SetNX sets a key with a value and TTL only if the key does not already exist.
func (c *Cache) SetNX(ctx context.Context, key string, val interface{}, ttl time.Duration) (bool, error) {
	if c == nil || c.client == nil {
		return true, nil
	}
	data, err := json.Marshal(val)
	if err != nil {
		return false, err
	}
	return c.client.SetNX(ctx, key, data, ttl).Result()
}
