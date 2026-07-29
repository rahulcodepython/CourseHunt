package redis

import (
	"context"
	"fmt"
	"log"
	"time"

	"coursehunt/api/internals/config"

	"github.com/redis/go-redis/v9"
)

func Connect(cfg *config.Config) *redis.Client {
	addr := fmt.Sprintf("%s:%s", cfg.RedisHost, cfg.RedisPort)

	client := redis.NewClient(&redis.Options{
		Addr:     addr,
		Password: cfg.RedisPassword,
		DB:       cfg.RedisDB,
	})

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)

	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		log.Printf("[redis] Warning: Failed to connect to Redis at %s: %v (caching will fallback gracefully)", addr, err)
	} else {
		log.Printf("[redis] Connected successfully to Redis at %s", addr)
	}

	return client
}
