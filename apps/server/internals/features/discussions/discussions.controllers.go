package discussions

import (
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/middlewares"
	"coursehunt/server/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (a *App) handleList(scope generic.AuthScope) fiber.Handler {
	return func(c *fiber.Ctx) error {
		page, limit := utils.PaginationParams(c)
		lessonID := c.Params("lessonId")
		userID := middlewares.UserID(c)

		list, total, err := a.List(c.UserContext(), lessonID, "", userID, scope, page, limit)
		if err != nil {
			return err
		}

		return utils.OK(c, "Discussions fetched.", generic.PaginatedResponse[[]Discussion]{
			Data: list, Total: total, Page: page, Limit: limit,
		})
	}
}

func (a *App) handleListReplies(scope generic.AuthScope) fiber.Handler {
	return func(c *fiber.Ctx) error {
		page, limit := utils.PaginationParams(c)
		parentID := c.Params("id")
		userID := middlewares.UserID(c)

		list, total, err := a.List(c.UserContext(), "", parentID, userID, scope, page, limit)
		if err != nil {
			return err
		}

		return utils.OK(c, "Replies fetched.", generic.PaginatedResponse[[]Discussion]{
			Data: list, Total: total, Page: page, Limit: limit,
		})
	}
}

func (a *App) handleCreate(scope generic.AuthScope) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var req CreateDiscussionRequest
		if err := utils.BindAndValidate(c, &req); err != nil {
			return err
		}

		userID := middlewares.UserID(c)
		d, err := a.Create(c.UserContext(), userID, req, scope)
		if err != nil {
			return err
		}

		return utils.Created(c, "Discussion posted.", d)
	}
}

func (a *App) handleUpdate(scope generic.AuthScope) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var req UpdateDiscussionRequest
		if err := utils.BindAndValidate(c, &req); err != nil {
			return err
		}

		userID := middlewares.UserID(c)
		d, err := a.Update(c.UserContext(), c.Params("id"), userID, req, scope)
		if err != nil {
			return err
		}

		return utils.OK(c, "Discussion updated.", d)
	}
}

func (a *App) handleDelete(scope generic.AuthScope) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userID := middlewares.UserID(c)
		id, err := a.Delete(c.UserContext(), c.Params("id"), userID, scope)
		if err != nil {
			return err
		}

		return utils.OK(c, "Discussion deleted.", generic.DeleteResponse{ID: id})
	}
}
