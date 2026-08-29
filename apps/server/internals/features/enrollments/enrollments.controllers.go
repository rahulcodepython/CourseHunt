package enrollments

import (
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/middlewares"
	"coursehunt/server/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (a *App) handleList(c *fiber.Ctx) error {
	courseID := c.Query("course_id")
	targetUserID := c.Query("user_id")

	scope := middlewares.ResolveScope(c)

	if scope == generic.ScopeTutor && courseID == "" {
		return utils.ErrBadRequest("Course ID required.", nil)
	}
	if scope != generic.ScopeTutor && courseID == "" && targetUserID == "" {
		return utils.ErrBadRequest("course_id or user_id is required.", nil)
	}

	page, limit := utils.PaginationParams(c)
	callerID := middlewares.UserID(c)

	list, total, err := a.List(c.Context(), scope, page, limit, courseID, targetUserID, callerID,
		c.Query("user_name"), c.Query("user_email"), c.Query("revoked"))
	if err != nil {
		return err
	}
	return utils.OK(c, "Enrollments fetched.", generic.PaginatedResponse[[]ListEnrollmentResponse]{
		Data: list, Total: total, Page: page, Limit: limit,
	})
}

func (a *App) handleRevoke(c *fiber.Ctx) error {
	if err := a.Revoke(c.Context(), c.Params("userId"), c.Params("courseId")); err != nil {
		return err
	}
	return utils.OK[any](c, "Course access revoked.", nil)
}

func (a *App) handleRegain(c *fiber.Ctx) error {
	if err := a.Regain(c.Context(), c.Params("userId"), c.Params("courseId")); err != nil {
		return err
	}
	return utils.OK[any](c, "Course access regained.", nil)
}
