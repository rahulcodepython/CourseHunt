package middlewares

import (
	"coursehunt/server/internals/generic"

	"github.com/gofiber/fiber/v2"
)

// UserFromContext reads the UserContext stored in Fiber locals.
func UserFromContext(c *fiber.Ctx) (*generic.UserContext, error) {
	user, ok := c.Locals("user").(*generic.UserContext)
	if !ok || user == nil {
		return nil, generic.ErrAuthNoUserContext
	}
	return user, nil
}

// UserID returns the authenticated user's ID string, or "" if unauthenticated.
func UserID(c *fiber.Ctx) string {
	if user, err := UserFromContext(c); err == nil && user != nil {
		return user.UserID
	}
	return ""
}
