package discussions

import (
	"errors"

	"coursehunt/api/internals/generic"

	"github.com/gofiber/fiber/v2"
)

func (m *DiscussionsModule) resolveScope(c *fiber.Ctx) generic.AuthScope {
	perm := c.Locals("permission")
	if perm == nil {
		return generic.ScopeTutor
	}
	return generic.ScopeFromPermission(perm.(string))
}

func errorForScope(scope generic.AuthScope, err error) (int, string) {
	switch {
	case errors.Is(err, ErrNotEnrolled):
		if scope == generic.ScopeEnrolled {
			return fiber.StatusForbidden, "Not enrolled in this course"
		}
		return fiber.StatusForbidden, "You do not own this course"
	case errors.Is(err, ErrAccessDenied):
		if scope == generic.ScopeUser || scope == generic.ScopeEnrolled {
			return fiber.StatusForbidden, "You do not own this discussion"
		}
		return fiber.StatusForbidden, "Access denied"
	case errors.Is(err, ErrTargetNotFound):
		return fiber.StatusNotFound, "Lesson or discussion not found"
	case errors.Is(err, ErrDiscussionNotFound):
		return fiber.StatusNotFound, "Discussion not found"
	case errors.Is(err, ErrLessonNotFound):
		return fiber.StatusNotFound, "Lesson not found"
	case errors.Is(err, ErrParentNotFound):
		return fiber.StatusNotFound, "Parent discussion not found"
	case errors.Is(err, ErrParentInvalid):
		return fiber.StatusBadRequest, "Parent discussion belongs to a different lesson"
	case errors.Is(err, ErrMissingTarget):
		return fiber.StatusBadRequest, "Lesson ID or parent ID is required"
	default:
		return fiber.StatusInternalServerError, "Internal server error"
	}
}
