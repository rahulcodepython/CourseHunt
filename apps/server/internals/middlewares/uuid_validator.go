package middlewares

import (
	"coursehunt/server/internals/utils"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// ValidateUUIDParams checks that named path parameters are valid UUIDs.
// If any parameter does not conform to UUID format, it short-circuits with a 404
// rather than allowing PostgreSQL to fail with SQLSTATE 22P02 (HTTP 500).
func ValidateUUIDParams(paramNames ...string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		for _, name := range paramNames {
			val := c.Params(name)
			if val != "" {
				if _, err := uuid.Parse(val); err != nil {
					return utils.ErrNotFound("Requested resource not found.", err)
				}
			}
		}
		return c.Next()
	}
}
