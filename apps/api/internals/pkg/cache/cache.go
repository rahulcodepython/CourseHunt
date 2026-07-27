package cache

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/redis/go-redis/v9"
)

type Cache struct {
	client *redis.Client
}

func NewCache(client *redis.Client) *Cache {
	return &Cache{client: client}
}

// Get fetches data from Redis and unmarshals it into dest.
// Returns (true, nil) on cache hit, (false, nil) on cache miss or when Redis is unavailable.
func (c *Cache) Get(ctx context.Context, key string, dest any) (bool, error) {
	if c == nil || c.client == nil {
		return false, nil
	}
	val, err := c.client.Get(ctx, key).Result()
	if err == redis.Nil {
		return false, nil
	} else if err != nil {
		log.Printf("[Cache] Get error for key %s: %v", key, err)
		return false, nil // fallback to DB on Redis error
	}
	if err := json.Unmarshal([]byte(val), dest); err != nil {
		log.Printf("[Cache] JSON unmarshal error for key %s: %v", key, err)
		return false, nil // fallback to DB on corruption
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
		log.Printf("[Cache] JSON marshal error for key %s: %v", key, err)
		return err
	}
	if err := c.client.Set(ctx, key, data, ttl).Err(); err != nil {
		log.Printf("[Cache] Set error for key %s: %v", key, err)
		return nil // Non-fatal Redis error
	}
	return nil
}

// SetGeneric stores a generic value of type T in Redis with given TTL.
func Set[T any](c *Cache, ctx context.Context, key string, val T, ttl time.Duration) error {
	return c.Set(ctx, key, val, ttl)
}

// Delete removes specific keys from Redis.
func (c *Cache) Delete(ctx context.Context, keys ...string) error {
	if c == nil || c.client == nil || len(keys) == 0 {
		return nil
	}
	if err := c.client.Del(ctx, keys...).Err(); err != nil {
		log.Printf("[Cache] Delete error: %v", err)
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
			log.Printf("[Cache] DeleteByPattern scan error (%s): %v", pattern, err)
			return nil
		}
		keys = append(keys, k...)
		if cursor == 0 {
			break
		}
	}
	if len(keys) > 0 {
		if err := c.client.Del(ctx, keys...).Err(); err != nil {
			log.Printf("[Cache] DeleteByPattern del error (%s): %v", pattern, err)
		}
	}
	return nil
}
