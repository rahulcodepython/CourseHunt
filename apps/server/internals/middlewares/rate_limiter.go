package middlewares

import (
	"time"

	"coursehunt/server/internals/utils"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/limiter"
)

func RateLimiterMiddleware() fiber.Handler {
	return limiter.New(limiter.Config{
		Max:        100,
		Expiration: 1 * time.Minute,
		KeyGenerator: func(c *fiber.Ctx) string {
			return c.IP()
		},
		LimitReached: func(c *fiber.Ctx) error {
			return utils.TooManyRequests(c, "Too many requests. Please try again later.", nil)
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
