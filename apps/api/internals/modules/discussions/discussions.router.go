package discussions

import (
	"coursehunt/api/internals/generic"
	"coursehunt/api/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (m *DiscussionsModule) Routes(v1, protected fiber.Router) {
	discussions := protected.Group("/discussions",
		middlewares.PermissionGuard(
			generic.AdminDiscussionRead, generic.AdminDiscussionWrite, generic.AdminDiscussionDelete,
			generic.TutorDiscussionRead, generic.TutorDiscussionWrite, generic.TutorDiscussionDelete,
			generic.EnrolledDiscussionRead, generic.EnrolledDiscussionWrite,
		),
	)

	discussions.Get("/:lessonId", m.ListController)
	discussions.Get("/replies/:id", m.ListRepliesController)
	discussions.Post("", m.CreateController)
	discussions.Patch("/:id", m.UpdateController)
	discussions.Delete("/:id", m.DeleteController)
}
