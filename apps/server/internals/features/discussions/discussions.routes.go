package discussions

import (
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (a *App) RegisterRoutes(router fiber.Router, auth fiber.Handler) {
	// Discussions mix elevated admin/tutor access (any discussion) with plain
	// self-scoped user access (own enrolled-course discussions, enforced by
	// ErrDiscussionsNotEnrolled in the repository) — ScopeGuard records the
	// elevated permission when present and otherwise defaults to ScopeUser.
	discussionElevatedPerms := []string{
		generic.PermAdminDiscussionRead, generic.PermAdminDiscussionWrite, generic.PermAdminDiscussionDelete,
		generic.PermTutorDiscussionRead, generic.PermTutorDiscussionWrite, generic.PermTutorDiscussionDelete,
	}
	scopeGuard := middlewares.ScopeGuard(discussionElevatedPerms...)

	g := router.Group("/v1/discussions", auth, scopeGuard)
	g.Get("/:lessonId", a.handleList)
	g.Get("/replies/:id", a.handleListReplies)
	g.Post("/", a.handleCreate)
	g.Patch("/:id", a.handleUpdate)
	g.Delete("/:id", a.handleDelete)
}
