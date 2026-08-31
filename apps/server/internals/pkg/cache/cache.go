package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"time"

	"github.com/redis/go-redis/v9"
)

type Cache struct {
	client *redis.Client
}

type GraceTokenPayload struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
}

func NewCache(client *redis.Client) *Cache {
	return &Cache{client: client}
}

// Ping checks health status of Redis connection
func (c *Cache) Ping(ctx context.Context) error {
	if c == nil || c.client == nil {
		return fmt.Errorf("redis cache client not initialized")
	}
	return c.client.Ping(ctx).Err()
}

// AcquireLock attempts to acquire a Redis lock for 5 seconds to prevent race conditions during token rotation
func (c *Cache) AcquireLock(ctx context.Context, lockKey string) (bool, error) {
	if c == nil || c.client == nil {
		return true, nil
	}
	return c.client.SetNX(ctx, "lock:"+lockKey, "1", 5*time.Second).Result()
}

// ReleaseLock releases the acquired Redis lock
func (c *Cache) ReleaseLock(ctx context.Context, lockKey string) {
	if c != nil && c.client != nil {
		_ = c.client.Del(ctx, "lock:"+lockKey).Err()
	}
}

// GetGraceTokens retrieves recently rotated tokens during parallel race conditions
func (c *Cache) GetGraceTokens(ctx context.Context, oldRefreshToken string) (*GraceTokenPayload, bool) {
	if c == nil || c.client == nil {
		return nil, false
	}
	val, err := c.client.Get(ctx, "grace:"+oldRefreshToken).Result()
	if err != nil {
		return nil, false
	}
	var payload GraceTokenPayload
	if err := json.Unmarshal([]byte(val), &payload); err != nil {
		return nil, false
	}
	return &payload, true
}

// SetGraceTokens caches newly rotated tokens for 30 seconds to serve parallel requests seamlessly
func (c *Cache) SetGraceTokens(ctx context.Context, oldRefreshToken string, payload *GraceTokenPayload) {
	if c == nil || c.client == nil {
		return
	}
	data, err := json.Marshal(payload)
	if err != nil {
		return
	}
	_ = c.client.Set(ctx, "grace:"+oldRefreshToken, data, 30*time.Second).Err()
}

// Get fetches data from Redis and unmarshals it into dest.
func (c *Cache) Get(ctx context.Context, key string, dest any) (bool, error) {
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

// GetGeneric fetches data from Redis into a pointer of generic type T.
func Get[T any](c *Cache, ctx context.Context, key string, dest *T) (bool, error) {
	return c.Get(ctx, key, dest)
}

// Set marshals value into JSON and stores it in Redis with the given TTL.
func (c *Cache) Set(ctx context.Context, key string, val any, ttl time.Duration) error {
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

// SetGeneric stores a generic value of type T in Redis with given TTL.
func Set[T any](c *Cache, ctx context.Context, key string, val T, ttl time.Duration) error {
	return c.Set(ctx, key, val, ttl)
}

// Fetch returns the cached value at key if present; otherwise it calls fn,
// caches the result for ttl, and returns it — the read-check-set pattern
// otherwise hand-written at the top of most cached service methods.
func Fetch[T any](ctx context.Context, c *Cache, key string, ttl time.Duration, fn func() (T, error)) (T, error) {
	var cached T
	if hit, _ := c.Get(ctx, key, &cached); hit {
		return cached, nil
	}
	result, err := fn()
	if err != nil {
		var zero T
		return zero, err
	}
	_ = c.Set(ctx, key, result, ttl)
	return result, nil
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
