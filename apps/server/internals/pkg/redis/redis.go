package redis

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"coursehunt/server/internals/config"
	"coursehunt/server/internals/pkg/retry"

	"github.com/redis/go-redis/v9"
)

func Connect(cfg *config.Config) *redis.Client {
	addr := fmt.Sprintf("%s:%s", cfg.RedisHost, cfg.RedisPort)

	client := redis.NewClient(&redis.Options{
		Addr:     addr,
		Password: cfg.RedisPassword,
		DB:       cfg.RedisDB,
	})

	const maxAttempts = 3
	err := retry.Connect("redis", maxAttempts, 1*time.Second, func() error {
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
