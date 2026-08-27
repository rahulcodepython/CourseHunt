package utils

import (
	"coursehunt/server/internals/generic"

	"github.com/gofiber/fiber/v2"
)

// json is the canonical response helper used throughout all handlers.
// Signature: utils.json(c, statusCode, success, message, data, errors)
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

func BadRequest(c *fiber.Ctx, message string, error error) error {
	return json[any](c, fiber.StatusBadRequest, false, message, nil, error)
}

func Unauthorized(c *fiber.Ctx, message string, error error) error {
	return json[any](c, fiber.StatusUnauthorized, false, message, nil, error)
}

func Forbidden(c *fiber.Ctx, message string, error error) error {
	return json[any](c, fiber.StatusForbidden, false, message, nil, error)
}

func NotFound(c *fiber.Ctx, message string, error error) error {
	return json[any](c, fiber.StatusNotFound, false, message, nil, error)
}

func UnprocessableEntity(c *fiber.Ctx, message string, error error) error {
	return json[any](c, fiber.StatusUnprocessableEntity, false, message, nil, error)
}

func InternalError(c *fiber.Ctx, message string, error error) error {
	return json[any](c, fiber.StatusInternalServerError, false, message, nil, error)
}

func TooManyRequests(c *fiber.Ctx, message string, error error) error {
	return json[any](c, fiber.StatusTooManyRequests, false, message, nil, error)
}
