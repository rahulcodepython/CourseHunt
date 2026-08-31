package middlewares

import (
	"time"

	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/utils"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/limiter"
)

// RateLimiterMiddleware caps requests per IP using Fiber's default in-memory
// store — no `Storage` is configured, so each process instance tracks its
// own independent budget. That's fine for a single instance, but the moment
// this runs behind a load balancer with more than one instance, each one
// gets its own 100/min allowance instead of a shared one, silently
// weakening the limit by a factor of the instance count. Wiring a
// Redis-backed fiber.Storage (the app already has a Redis client available
// app-wide) is the fix if/when this scales horizontally.
func RateLimiterMiddleware() fiber.Handler {
	return limiter.New(limiter.Config{
		Max:        100,
		Expiration: 1 * time.Minute,
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
