package v1

import (
	"coursehunt-backend/internals/middlewares"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

func authEmail(c *fiber.Ctx) string {
	if user, ok := c.Locals("user").(middlewares.UserContext); ok {
		return user.Email
	}
	email, _ := c.Locals("email").(string)
	return email
}

func authUserID(c *fiber.Ctx) string {
	if user, ok := c.Locals("user").(middlewares.UserContext); ok {
		return user.UserID
	}
	return ""
}

func authPosition(c *fiber.Ctx) string {
	if user, ok := c.Locals("user").(middlewares.UserContext); ok {
		return user.Position
	}
	return ""
}

func idParam(c *fiber.Ctx) (int, error) {
	return strconv.Atoi(c.Params("id"))
}
