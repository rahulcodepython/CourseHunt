package middlewares

import (
	"fmt"
	"time"

	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/utils"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/limiter"
	"github.com/redis/go-redis/v9"
)

// RateLimiterMiddleware caps requests per IP across instances using Redis storage.
func RateLimiterMiddleware(rdb *redis.Client) fiber.Handler {
	var storage fiber.Storage
	if rdb != nil {
		storage = NewRedisStorage(rdb)
	}

	return limiter.New(limiter.Config{
		Max:        100,
		Expiration: 1 * time.Minute,
		Storage:    storage,
		KeyGenerator: func(c *fiber.Ctx) string {
			return c.IP()
		},
		LimitReached: func(c *fiber.Ctx) error {
			return utils.ErrTooManyRequests(generic.ErrMsgTooManyRequests, nil)
		},
		// docker-compose's own healthcheck polls this route from inside the
		// container network every 15s; exempting it stops legitimate,
		// low-volume infra polling (or a burst of real client traffic from
		// one IP) from tripping the same 429 that would otherwise make
		// Docker mark this container unhealthy and restart it — a
		// self-inflicted outage triggered by the rate limiter meant to
		// prevent abuse, not cause it.
		Next: func(c *fiber.Ctx) bool {
			return c.Path() == "/api/v1/health"
		},
	})
}

// TieredRouteRateLimiter provides route-specific limits (e.g. coupon checking, cert verification).
func TieredRouteRateLimiter(rdb *redis.Client, max int, expiration time.Duration, keyPrefix string) fiber.Handler {
	var storage fiber.Storage
	if rdb != nil {
		storage = NewRedisStorage(rdb)
	}

	return limiter.New(limiter.Config{
		Max:        max,
		Expiration: expiration,
		Storage:    storage,
		KeyGenerator: func(c *fiber.Ctx) string {
			return fmt.Sprintf("rl:%s:%s", keyPrefix, c.IP())
		},
		LimitReached: func(c *fiber.Ctx) error {
			return utils.ErrTooManyRequests(generic.ErrMsgTooManyRequests, nil)
		},
	})
}
