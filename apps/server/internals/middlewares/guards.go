package middlewares

import (
	"coursehunt/server/internals/utils"

	"github.com/gofiber/fiber/v2"
)

// PermissionGuard restricts a route to callers holding the specified permission.
func PermissionGuard(requiredPermission string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		user, err := UserFromContext(c)
		if err != nil {
			return utils.ErrUnauthorized("Unauthorized.", err)
		}

		if _, hasPerm := user.Permissions[requiredPermission]; hasPerm {
			return c.Next()
		}

		return utils.ErrForbidden("Permission denied.", nil)
	}
}

// RoleGuard restricts a route to one or more account segments (admin/tutor/user).
func RoleGuard(allowed ...string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		user, err := UserFromContext(c)
		if err != nil {
			return utils.ErrUnauthorized("Unauthorized.", err)
		}
		for _, r := range allowed {
			if user.Role == r {
				return c.Next()
			}
		}
		return utils.ErrForbidden("Permission denied.", nil)
	}
}
