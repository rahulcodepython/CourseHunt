package discussions

import (
	"errors"

	"coursehunt/api/internals/generic"
	"coursehunt/api/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (m *DiscussionsModule) resolveScope(c *fiber.Ctx) generic.AuthScope {
	perm := c.Locals("permission")
	if perm == nil {
		return generic.ScopeUser
	}
	return generic.ScopeFromPermission(perm.(string))
}

func errorForScope(c *fiber.Ctx, scope generic.AuthScope, err error) error {
	switch {
	case errors.Is(err, ErrNotEnrolled):
		if scope == generic.ScopeEnrolled {
			return utils.Forbidden(c, "Not enrolled in this course", err)
		}
		return utils.Forbidden(c, "You do not own this course", err)
	case errors.Is(err, ErrAccessDenied):
		if scope == generic.ScopeUser || scope == generic.ScopeEnrolled {
			return utils.Forbidden(c, "You do not own this discussion", err)
		}
		return utils.Forbidden(c, "Access denied", err)
	case errors.Is(err, ErrTargetNotFound):
		return utils.NotFound(c, "Lesson or discussion not found", err)
	case errors.Is(err, ErrDiscussionNotFound):
		return utils.NotFound(c, "Discussion not found", err)
	case errors.Is(err, ErrLessonNotFound):
		return utils.NotFound(c, "Lesson not found", err)
	case errors.Is(err, ErrParentNotFound):
		return utils.NotFound(c, "Parent discussion not found", err)
	case errors.Is(err, ErrParentInvalid):
		return utils.BadRequest(c, "Parent discussion belongs to a different lesson", err)
	case errors.Is(err, ErrMissingTarget):
		return utils.BadRequest(c, "Lesson ID or parent ID is required", err)
	default:
		return utils.InternalError(c, "Internal server error", err)
	}
}
