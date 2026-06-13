package utils

import (
	"log"

	"github.com/gofiber/fiber/v2"
)

// globalErrorHandler is the last-resort error handler for Fiber.
func GlobalErrorHandler(c *fiber.Ctx, err error) error {
	code := fiber.StatusInternalServerError
	if e, ok := err.(*fiber.Error); ok {
		code = e.Code
	}

	log.Printf("[error] %s %s -> %d: %v", c.Method(), c.Path(), code, err)
	return InternalError(c, err.Error())
}
