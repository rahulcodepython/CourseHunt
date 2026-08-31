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

// --- Admin Handlers ---

func (a *App) handleAdminList(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	isPinned := c.Query("is_pinned")
	userName := c.Query("user_name")
	userEmail := c.Query("user_email")
	courseID := c.Query("course_id")

	list, total, err := a.AdminList(c.Context(), page, limit, isPinned, userName, userEmail, courseID)
	if err != nil {
		return err
	}

	return utils.OK(c, "Feedbacks fetched.", generic.PaginatedResponse[[]Feedback]{
		Data: list, Total: total, Page: page, Limit: limit,
	})
}

func (a *App) handleAdminUpdate(c *fiber.Ctx) error {
	var req PinFeedbackRequest
	if err := utils.BindAndValidate(c, &req); err != nil {
		return err
	}

	f, err := a.AdminUpdate(c.Context(), c.Params("id"), req.IsPinned)
	if err != nil {
		return err
	}

	return utils.OK(c, "Feedback pin status updated.", f)
}

func (a *App) handleAdminDelete(c *fiber.Ctx) error {
	id, err := a.AdminDelete(c.Context(), c.Params("id"))
	if err != nil {
		return err
	}

	return utils.OK(c, "Feedback deleted.", generic.DeleteResponse{ID: id})
}

// --- Tutor Handlers ---

func (a *App) handleTutorList(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	userID := middlewares.UserID(c)
	isPinned := c.Query("is_pinned")
	userName := c.Query("user_name")
	userEmail := c.Query("user_email")
	courseID := c.Query("course_id")

	list, total, err := a.TutorList(c.Context(), userID, page, limit, isPinned, userName, userEmail, courseID)
	if err != nil {
		return err
	}

	return utils.OK(c, "Feedbacks fetched.", generic.PaginatedResponse[[]Feedback]{
		Data: list, Total: total, Page: page, Limit: limit,
	})
}

func (a *App) handleTutorDelete(c *fiber.Ctx) error {
	userID := middlewares.UserID(c)

	id, err := a.TutorDelete(c.Context(), c.Params("id"), userID)
	if err != nil {
		return err
	}

	return utils.OK(c, "Feedback deleted.", generic.DeleteResponse{ID: id})
}
