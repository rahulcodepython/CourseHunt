package cache

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"time"

	"coursehunt/server/internals/pkg/postgres"

	"github.com/redis/go-redis/v9"
)

const (
	// NegativeCacheTTL is the short lifespan for non-existent entities
	NegativeCacheTTL = 60 * time.Second
	// NullSentinel is the token stored in Redis to represent non-existence
	NullSentinel = "__REDIS_NULL_SENTINEL__"
)

// Fetch returns the cached value at key if present; otherwise it calls fn,
// caches the result for ttl, and returns it — the read-check-set pattern
// otherwise hand-written at the top of most cached service methods.
func Fetch[T interface{}](ctx context.Context, c *Cache, key string, ttl time.Duration, fn func() (T, error)) (T, error) {
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

// FetchOrNegative provides complete protection against cache penetration attacks.
// If the loader returns an error matching isNotFound, it stores a sentinel value in Redis.
func FetchOrNegative[T interface{}](
	ctx context.Context,
	c *Cache,
	key string,
	ttl time.Duration,
	isNotFound func(error) bool,
	fn func() (T, error),
) (T, error) {
	var zero T
	if c == nil || c.client == nil {
		return fn()
	}

	if isNotFound == nil {
		isNotFound = func(err error) bool {
			return errors.Is(err, postgres.ErrNotFound)
		}
	}

	// 1. Check Redis Cache
	val, err := c.client.Get(ctx, key).Result()
	if err == nil {
		// Cache Hit: Check if it's a negative sentinel
		if val == NullSentinel {
			return zero, postgres.ErrNotFound
		}
		var dest T
		if err := json.Unmarshal([]byte(val), &dest); err == nil {
			return dest, nil
		}
	} else if err != redis.Nil {
		slog.Error("redis get error", "key", key, "err", err)
	}

	// 2. Cache Miss: Execute Loader Function
	result, err := fn()
	if err != nil {
		// 3. Negative Cache: If not found, cache the sentinel
		if isNotFound(err) {
			_ = c.client.Set(ctx, key, NullSentinel, NegativeCacheTTL).Err()
			return zero, postgres.ErrNotFound
		}
		return zero, err
	}

	// 4. Positive Cache: Store actual result
	data, marshalErr := json.Marshal(result)
	if marshalErr == nil {
		_ = c.client.Set(ctx, key, data, ttl).Err()
	}
	return result, nil
}
