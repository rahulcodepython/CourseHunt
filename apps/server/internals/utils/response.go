package utils

import (
	"coursehunt/server/internals/generic"

	"github.com/gofiber/fiber/v2"
)

// json is the canonical response envelope used by every handler (success,
// via OK/Created below) and by the central ErrorHandler (errors.go/
// error.handler.go) for every failure. It's the one place the wire shape is
// defined.
func json[T any](c *fiber.Ctx, status int, success bool, message string, data T, err error) error {
	var errStr string
	if err != nil {
		errStr = err.Error()
		c.Locals("handler_error", err)
	}
	if status >= 400 {
		c.Locals("handler_error_msg", message)
	}
	body := generic.Response[T]{
		Success: success,
		Message: message,
		Data:    data,
		Error:   errStr,
	}
	return c.Status(status).JSON(body)
}

func OK[T any](c *fiber.Ctx, message string, data T) error {
	return json(c, fiber.StatusOK, true, message, data, nil)
}

func Created[T any](c *fiber.Ctx, message string, data T) error {
	return json(c, fiber.StatusCreated, true, message, data, nil)
}
