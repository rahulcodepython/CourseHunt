package feedbacks

import (
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/middlewares"
	"coursehunt/server/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (a *App) handleCreate(c *fiber.Ctx) error {
	var req CreateFeedbackRequest
	if err := utils.BindAndValidate(c, &req); err != nil {
		return err
	}
	userID := middlewares.UserID(c)

	f, err := a.Create(c.Context(), userID, req.CourseID, req)
	if err != nil {
		return err
	}

	return utils.Created(c, "Feedback posted.", f)
}

func (a *App) handleList(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	scope := middlewares.ResolveScope(c)
	userID := middlewares.UserID(c)
	isPinned := c.Query("is_pinned")
	userName := c.Query("user_name")
	userEmail := c.Query("user_email")
	courseID := c.Query("course_id")

	list, total, err := a.List(c.Context(), scope, userID, page, limit, isPinned, userName, userEmail, courseID)
	if err != nil {
		return err
	}

	return utils.OK(c, "Feedbacks fetched.", generic.PaginatedResponse[[]Feedback]{
		Data: list, Total: total, Page: page, Limit: limit,
	})
}

func (a *App) handleListPinned(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	courseID := c.Query("course_id")

	list, total, err := a.ListPinned(c.Context(), page, limit, courseID)
	if err != nil {
		return err
	}

	return utils.OK(c, "Pinned feedbacks fetched.", generic.PaginatedResponse[[]Feedback]{
		Data: list, Total: total, Page: page, Limit: limit,
	})
}

func (a *App) handleUpdate(c *fiber.Ctx) error {
	var req PinFeedbackRequest
	if err := utils.BindAndValidate(c, &req); err != nil {
		return err
	}

	f, err := a.Update(c.Context(), c.Params("id"), req.IsPinned)
	if err != nil {
		return err
	}

	return utils.OK(c, "Feedback pin status updated.", f)
}

func (a *App) handleDelete(c *fiber.Ctx) error {
	scope := middlewares.ResolveScope(c)
	userID := middlewares.UserID(c)

	id, err := a.Delete(c.Context(), c.Params("id"), userID, scope)
	if err != nil {
		return err
	}

	return utils.OK(c, "Feedback deleted.", generic.DeleteResponse{ID: id})
}
