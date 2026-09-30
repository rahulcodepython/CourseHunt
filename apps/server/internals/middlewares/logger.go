package middlewares

import (
	"time"

	"coursehunt/server/internals/pkg/middleware"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
)

// LoggerMiddleware records structured request metrics, logs API errors with sanitized request bodies,
// and enqueues operational audit records to PostgreSQL asynchronously.
func LoggerMiddleware(db *pgxpool.Pool) fiber.Handler {
	if db != nil {
		middleware.StartAuditWorkers()
	}

	return func(c *fiber.Ctx) error {
		start := time.Now()

		err := c.Next()

		latency := time.Since(start)
		status := c.Response().StatusCode()

		middleware.ProcessAPILog(c, db, latency, status, err)

		return err
	}
}
