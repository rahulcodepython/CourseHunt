package courses

import (
	"coursehunt/api/internals/generic"

	"github.com/gofiber/fiber/v2"
)

func (m *CoursesModule) resolveScope(c *fiber.Ctx) generic.AuthScope {
	perm := c.Locals("permission")
	if perm == nil {
		return generic.ScopeUser
	}
	return generic.ScopeFromPermission(perm.(string))
}
