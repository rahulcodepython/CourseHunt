package utils

import (
	"github.com/gofiber/fiber/v2"
)

func GetUserID(c *fiber.Ctx) string {
	if v := c.Locals("userID"); v != nil {
		return v.(string)
	}
	return ""
}
