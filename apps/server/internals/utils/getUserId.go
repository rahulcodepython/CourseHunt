package utils

import (
	"coursehunt/server/internals/generic"

	"github.com/gofiber/fiber/v2"
)

func GetUserID(c *fiber.Ctx) string {
	u := GetUserFromCtx(c)
	if u != nil {
		return u.UserID
	}
	return ""
}

func GetUserFromCtx(c *fiber.Ctx) *generic.UserContext {
	if v := c.Locals("user"); v != nil {
		u, ok := v.(*generic.UserContext)
		if ok {
			return u
		}
	}
	return nil
}
