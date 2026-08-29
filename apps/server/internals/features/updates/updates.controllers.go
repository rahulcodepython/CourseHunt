package updates

import (
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/middlewares"
	"coursehunt/server/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (a *App) handleCreate(c *fiber.Ctx) error {
	var req CreateUpdateRequest
	if err := utils.BindAndValidate(c, &req); err != nil {
		return err
	}
	scope := middlewares.ResolveScope(c)

	u, err := a.Create(c.Context(), middlewares.UserID(c), req, scope)
	if err != nil {
		return err
	}

	return utils.Created(c, "Update created.", u)
}

func (a *App) handleUpdate(c *fiber.Ctx) error {
	var req UpdateUpdateRequest
	if err := utils.BindAndValidate(c, &req); err != nil {
		return err
	}
	scope := middlewares.ResolveScope(c)

	u, err := a.Update(c.Context(), c.Params("id"), req.Message, middlewares.UserID(c), scope)
	if err != nil {
		return err
	}

	return utils.OK(c, "Update modified.", u)
}

func (a *App) handleDelete(c *fiber.Ctx) error {
	scope := middlewares.ResolveScope(c)

	id, err := a.Delete(c.Context(), c.Params("id"), middlewares.UserID(c), scope)
	if err != nil {
		return err
	}

	return utils.OK(c, "Update deleted.", generic.DeleteResponse{ID: id})
}

func (a *App) handleFeed(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	userID := middlewares.UserID(c)

	feed, err := a.Feed(c.Context(), userID, page, limit)
	if err != nil {
		return err
	}

	return utils.OK(c, "Update feed fetched.", feed)
}

func (a *App) handleList(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	scope := middlewares.ResolveScope(c)
	userID := middlewares.UserID(c)

	list, total, err := a.List(c.Context(), page, limit, userID, scope)
	if err != nil {
		return err
	}

	return utils.OK(c, "Updates fetched.", generic.PaginatedResponse[[]CourseUpdate]{
		Data: list, Total: total, Page: page, Limit: limit,
	})
}
