package discussions

import (
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/middlewares"
	"coursehunt/server/internals/utils"

	"github.com/gofiber/fiber/v2"
)

// --- Admin Handlers ---

func (a *App) handleAdminList(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	lessonID := c.Params("lessonId")
	userID := middlewares.UserID(c)

	list, total, err := a.List(c.Context(), lessonID, "", userID, generic.ScopeAdmin, page, limit)
	if err != nil {
		return err
	}

	return utils.OK(c, "Discussions fetched.", generic.PaginatedResponse[[]Discussion]{
		Data: list, Total: total, Page: page, Limit: limit,
	})
}

func (a *App) handleAdminListReplies(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	parentID := c.Params("id")
	userID := middlewares.UserID(c)

	list, total, err := a.List(c.Context(), "", parentID, userID, generic.ScopeAdmin, page, limit)
	if err != nil {
		return err
	}

	return utils.OK(c, "Replies fetched.", generic.PaginatedResponse[[]Discussion]{
		Data: list, Total: total, Page: page, Limit: limit,
	})
}

func (a *App) handleAdminCreate(c *fiber.Ctx) error {
	var req CreateDiscussionRequest
	if err := utils.BindAndValidate(c, &req); err != nil {
		return err
	}

	userID := middlewares.UserID(c)
	d, err := a.Create(c.Context(), userID, req, generic.ScopeAdmin)
	if err != nil {
		return err
	}

	return utils.Created(c, "Discussion posted.", d)
}

func (a *App) handleAdminUpdate(c *fiber.Ctx) error {
	var req UpdateDiscussionRequest
	if err := utils.BindAndValidate(c, &req); err != nil {
		return err
	}

	userID := middlewares.UserID(c)
	d, err := a.Update(c.Context(), c.Params("id"), userID, req, generic.ScopeAdmin)
	if err != nil {
		return err
	}

	return utils.OK(c, "Discussion updated.", d)
}

func (a *App) handleAdminDelete(c *fiber.Ctx) error {
	userID := middlewares.UserID(c)
	id, err := a.Delete(c.Context(), c.Params("id"), userID, generic.ScopeAdmin)
	if err != nil {
		return err
	}

	return utils.OK(c, "Discussion deleted.", generic.DeleteResponse{ID: id})
}

// --- Tutor Handlers ---

func (a *App) handleTutorList(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	lessonID := c.Params("lessonId")
	userID := middlewares.UserID(c)

	list, total, err := a.List(c.Context(), lessonID, "", userID, generic.ScopeTutor, page, limit)
	if err != nil {
		return err
	}

	return utils.OK(c, "Discussions fetched.", generic.PaginatedResponse[[]Discussion]{
		Data: list, Total: total, Page: page, Limit: limit,
	})
}

func (a *App) handleTutorListReplies(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	parentID := c.Params("id")
	userID := middlewares.UserID(c)

	list, total, err := a.List(c.Context(), "", parentID, userID, generic.ScopeTutor, page, limit)
	if err != nil {
		return err
	}

	return utils.OK(c, "Replies fetched.", generic.PaginatedResponse[[]Discussion]{
		Data: list, Total: total, Page: page, Limit: limit,
	})
}

func (a *App) handleTutorCreate(c *fiber.Ctx) error {
	var req CreateDiscussionRequest
	if err := utils.BindAndValidate(c, &req); err != nil {
		return err
	}

	userID := middlewares.UserID(c)
	d, err := a.Create(c.Context(), userID, req, generic.ScopeTutor)
	if err != nil {
		return err
	}

	return utils.Created(c, "Discussion posted.", d)
}

func (a *App) handleTutorUpdate(c *fiber.Ctx) error {
	var req UpdateDiscussionRequest
	if err := utils.BindAndValidate(c, &req); err != nil {
		return err
	}

	userID := middlewares.UserID(c)
	d, err := a.Update(c.Context(), c.Params("id"), userID, req, generic.ScopeTutor)
	if err != nil {
		return err
	}

	return utils.OK(c, "Discussion updated.", d)
}

func (a *App) handleTutorDelete(c *fiber.Ctx) error {
	userID := middlewares.UserID(c)
	id, err := a.Delete(c.Context(), c.Params("id"), userID, generic.ScopeTutor)
	if err != nil {
		return err
	}

	return utils.OK(c, "Discussion deleted.", generic.DeleteResponse{ID: id})
}

// --- Student Handlers ---

func (a *App) handleStudentList(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	lessonID := c.Params("lessonId")
	userID := middlewares.UserID(c)

	list, total, err := a.List(c.Context(), lessonID, "", userID, generic.ScopeUser, page, limit)
	if err != nil {
		return err
	}

	return utils.OK(c, "Discussions fetched.", generic.PaginatedResponse[[]Discussion]{
		Data: list, Total: total, Page: page, Limit: limit,
	})
}

func (a *App) handleStudentListReplies(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	parentID := c.Params("id")
	userID := middlewares.UserID(c)

	list, total, err := a.List(c.Context(), "", parentID, userID, generic.ScopeUser, page, limit)
	if err != nil {
		return err
	}

	return utils.OK(c, "Replies fetched.", generic.PaginatedResponse[[]Discussion]{
		Data: list, Total: total, Page: page, Limit: limit,
	})
}

func (a *App) handleStudentCreate(c *fiber.Ctx) error {
	var req CreateDiscussionRequest
	if err := utils.BindAndValidate(c, &req); err != nil {
		return err
	}

	userID := middlewares.UserID(c)
	d, err := a.Create(c.Context(), userID, req, generic.ScopeUser)
	if err != nil {
		return err
	}

	return utils.Created(c, "Discussion posted.", d)
}

func (a *App) handleStudentUpdate(c *fiber.Ctx) error {
	var req UpdateDiscussionRequest
	if err := utils.BindAndValidate(c, &req); err != nil {
		return err
	}

	userID := middlewares.UserID(c)
	d, err := a.Update(c.Context(), c.Params("id"), userID, req, generic.ScopeUser)
	if err != nil {
		return err
	}

	return utils.OK(c, "Discussion updated.", d)
}

func (a *App) handleStudentDelete(c *fiber.Ctx) error {
	userID := middlewares.UserID(c)
	id, err := a.Delete(c.Context(), c.Params("id"), userID, generic.ScopeUser)
	if err != nil {
		return err
	}

	return utils.OK(c, "Discussion deleted.", generic.DeleteResponse{ID: id})
}
