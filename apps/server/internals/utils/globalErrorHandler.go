package utils

import (
	"github.com/gofiber/fiber/v2"
)

// globalErrorHandler is the last-resort error handler for Fiber.
func GlobalErrorHandler(c *fiber.Ctx, err error) error {
	code := fiber.StatusInternalServerError
	if e, ok := err.(*fiber.Error); ok {
		code = e.Code
	}

	c.Locals("handler_error", err)

	if code == fiber.StatusNotFound {
		return NotFound(c, "Requested resource not found.", err)
	}

	return json[any](c, code, false, "An unexpected error occurred.", nil, err)
}
