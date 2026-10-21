package redis

import (
	"context"
	"log/slog"
	"time"

	"coursehunt/server/internals/config"
	"coursehunt/server/internals/pkg/retry"

	"github.com/redis/go-redis/v9"
)

// Connect returns nil when REDIS_URL is unset: Redis is optional, and every
// caller (cache, rate limiter, heartbeat) has an in-process fallback.
func Connect(cfg *config.Config) *redis.Client {
	if cfg.RedisURL == "" {
		slog.Info("redis disabled (REDIS_URL not set); using in-process fallbacks")
		return nil
	}

	// Accepts redis://[user:pass@]host:port[/db] and rediss:// (TLS).
	opts, err := redis.ParseURL(cfg.RedisURL)
	if err != nil {
		slog.Warn("invalid REDIS_URL, running without redis", "error", err)
		return nil
	}
	addr := opts.Addr

	client := redis.NewClient(opts)

	const maxAttempts = 3
	err = retry.Connect("redis", maxAttempts, 1*time.Second, func() error {
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		defer cancel()
		return client.Ping(ctx).Err()
	})
	if err != nil {
		// Redis is a soft dependency — caching degrades gracefully rather
		// than blocking boot, so a final failure here is a warning, not fatal.
		slog.Warn("failed to connect to redis, caching will fallback gracefully",
			"addr", addr, "attempts", maxAttempts, "error", err)
	} else {
		slog.Info("connected to redis", "addr", addr)
	}

	return client
}
