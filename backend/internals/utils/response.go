package utils

import (
	"github.com/gofiber/fiber/v2"
)

// JSON is the canonical response helper used throughout all handlers.
// Signature: utils.JSON(c, statusCode, success, message, data, errors)
func JSON(c *fiber.Ctx, status int, success bool, message string, data interface{}, errors interface{}) error {
	body := fiber.Map{
		"success": success,
		"message": message,
		"data":    data,
	}
	if errors != nil {
		body["errors"] = errors
	}
	return c.Status(status).JSON(body)
}

// Convenience wrappers kept for backward compat with existing storage handler.
func Response(c *fiber.Ctx, status int, success bool, message string, data interface{}) error {
	return JSON(c, status, success, message, data, nil)
}

func OK(c *fiber.Ctx, message string, data interface{}) error {
	return JSON(c, fiber.StatusOK, true, message, data, nil)
}

func Created(c *fiber.Ctx, message string, data interface{}) error {
	return JSON(c, fiber.StatusCreated, true, message, data, nil)
}

func BadRequest(c *fiber.Ctx, message string) error {
	return JSON(c, fiber.StatusBadRequest, false, message, nil, nil)
}

func Unauthorized(c *fiber.Ctx, message string) error {
	return JSON(c, fiber.StatusUnauthorized, false, message, nil, nil)
}

func Forbidden(c *fiber.Ctx, message string) error {
	return JSON(c, fiber.StatusForbidden, false, message, nil, nil)
}

func NotFound(c *fiber.Ctx, message string) error {
	return JSON(c, fiber.StatusNotFound, false, message, nil, nil)
}

func InternalError(c *fiber.Ctx, message string) error {
	return JSON(c, fiber.StatusInternalServerError, false, message, nil, nil)
}

func TooManyRequests(c *fiber.Ctx, message string) error {
	return JSON(c, fiber.StatusTooManyRequests, false, message, nil, nil)
}
