package utils

import (
	"coursehunt-backend/internals/models"

	"github.com/gofiber/fiber/v2"
)

func GetUserID(c *fiber.Ctx) string {
	u := GetUserFromCtx(c)
	if u != nil {
		return u.UserID
	}
	return ""
}

func GetUserFromCtx(c *fiber.Ctx) *models.UserContext {
	if v := c.Locals("user"); v != nil {
		u, ok := v.(models.UserContext)
		if ok {
			return &u
		}
	}
	return nil
}
