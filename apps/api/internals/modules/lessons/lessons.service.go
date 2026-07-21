package lessons

import (
	"coursehunt/api/internals/generic"

	"github.com/gofiber/fiber/v2"
)

func (m *LessonsModule) resolveScope(c *fiber.Ctx) generic.AuthScope {
	perm := c.Locals("permission")
	if perm == nil {
		return generic.ScopeTutor
	}
	return generic.ScopeFromPermission(perm.(string))
}
