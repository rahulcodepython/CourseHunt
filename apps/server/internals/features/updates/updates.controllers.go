package updates

import (
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/middlewares"
	"coursehunt/server/internals/utils"

	"github.com/gofiber/fiber/v2"
)

// --- Admin Handlers ---

func (a *App) handleAdminList(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)

	list, total, err := a.AdminList(c.Context(), page, limit)
	if err != nil {
		return err
	}

	return utils.OK(c, "Updates fetched.", generic.PaginatedResponse[[]CourseUpdate]{
		Data: list, Total: total, Page: page, Limit: limit,
	})
}

func (a *App) handleAdminCreate(c *fiber.Ctx) error {
	var req CreateUpdateRequest
	if err := utils.BindAndValidate(c, &req); err != nil {
		return err
	}

	u, err := a.AdminCreate(c.Context(), middlewares.UserID(c), req)
	if err != nil {
		return err
	}

	return utils.Created(c, "Update created.", u)
}

func (a *App) handleAdminUpdate(c *fiber.Ctx) error {
	var req UpdateUpdateRequest
	if err := utils.BindAndValidate(c, &req); err != nil {
		return err
	}

	u, err := a.AdminUpdate(c.Context(), c.Params("id"), req.Message)
	if err != nil {
		return err
	}

	return utils.OK(c, "Update modified.", u)
}

func (a *App) handleAdminDelete(c *fiber.Ctx) error {
	id, err := a.AdminDelete(c.Context(), c.Params("id"))
	if err != nil {
		return err
	}

	return utils.OK(c, "Update deleted.", generic.DeleteResponse{ID: id})
}

// --- Tutor Handlers ---

func (a *App) handleTutorList(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	userID := middlewares.UserID(c)

	list, total, err := a.TutorList(c.Context(), page, limit, userID)
	if err != nil {
		return err
	}

	return utils.OK(c, "Updates fetched.", generic.PaginatedResponse[[]CourseUpdate]{
		Data: list, Total: total, Page: page, Limit: limit,
	})
}

func (a *App) handleTutorCreate(c *fiber.Ctx) error {
	var req CreateUpdateRequest
	if err := utils.BindAndValidate(c, &req); err != nil {
		return err
	}

	u, err := a.TutorCreate(c.Context(), middlewares.UserID(c), req)
	if err != nil {
		return err
	}

	return utils.Created(c, "Update created.", u)
}

func (a *App) handleTutorUpdate(c *fiber.Ctx) error {
	var req UpdateUpdateRequest
	if err := utils.BindAndValidate(c, &req); err != nil {
		return err
	}

	u, err := a.TutorUpdate(c.Context(), c.Params("id"), req.Message, middlewares.UserID(c))
	if err != nil {
		return err
	}

	return utils.OK(c, "Update modified.", u)
}

func (a *App) handleTutorDelete(c *fiber.Ctx) error {
	userID := middlewares.UserID(c)

	id, err := a.TutorDelete(c.Context(), c.Params("id"), userID)
	if err != nil {
		return err
	}

	return utils.OK(c, "Update deleted.", generic.DeleteResponse{ID: id})
}

// --- Student Feed Handler ---

func (a *App) handleFeed(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	userID := middlewares.UserID(c)

	feed, err := a.FeedRepository(c.Context(), userID, page, limit)
	if err != nil {
		return err
	}

	return utils.OK(c, "Update feed fetched.", feed)
}
