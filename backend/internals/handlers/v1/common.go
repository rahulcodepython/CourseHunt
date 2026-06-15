package v1

import (
	"coursehunt-backend/internals/middlewares"
	"slices"
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

// authPosition returns the highest-priority role the authenticated user holds.
// Priority: admin > tutor > student (empty string if none).
// This preserves compatibility with existing service/repository logic that
// distinguishes admin/tutor filtering by a single position string.
func authPosition(c *fiber.Ctx) string {
	user, ok := c.Locals("user").(middlewares.UserContext)
	if !ok {
		return ""
	}
	roles := user.Roles
	switch {
	case slices.Contains(roles, "admin"):
		return "admin"
	case slices.Contains(roles, "tutor"):
		return "tutor"
	case slices.Contains(roles, "student"):
		return "student"
	default:
		return ""
	}
}

func idParam(c *fiber.Ctx) (int, error) {
	return strconv.Atoi(c.Params("id"))
}
