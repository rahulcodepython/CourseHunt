package utils

import (
	"github.com/gofiber/fiber/v2"
)

func Response(c *fiber.Ctx, status int, success bool, message string, data interface{}) error {
	return c.Status(status).JSON(fiber.Map{
		"success": success,
		"message": message,
		"data":    data,
	})
}

func OK(c *fiber.Ctx, message string, data interface{}) error {
	return Response(c, fiber.StatusOK, true, message, data)
}

func Created(c *fiber.Ctx, message string, data interface{}) error {
	return Response(c, fiber.StatusCreated, true, message, data)
}

func BadRequest(c *fiber.Ctx, message string) error {
	return Response(c, fiber.StatusBadRequest, false, message, nil)
}

func Unauthorized(c *fiber.Ctx, message string) error {
	return Response(c, fiber.StatusUnauthorized, false, message, nil)
}

func InternalError(c *fiber.Ctx, message string) error {
	return Response(c, fiber.StatusInternalServerError, false, message, nil)
}

func TooManyRequests(c *fiber.Ctx, message string) error {
	return Response(c, fiber.StatusTooManyRequests, false, message, nil)
}
