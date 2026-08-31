package wishlist

import (
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/middlewares"
	"coursehunt/server/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (a *App) handleList(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	userID := middlewares.UserID(c)

	list, total, err := a.List(c.Context(), userID, page, limit)
	if err != nil {
		return err
	}

	return utils.OK(c, "Wishlist fetched.", generic.PaginatedResponse[[]WishlistItem]{
		Data: list, Total: total, Page: page, Limit: limit,
	})
}

func (a *App) handleCreate(c *fiber.Ctx) error {
	var req CreateWishlistRequest
	if err := utils.BindAndValidate(c, &req); err != nil {
		return err
	}
	userID := middlewares.UserID(c)

	item, err := a.Create(c.Context(), userID, req.CourseID)
	if err != nil {
		return err
	}

	return utils.Created(c, "Added to wishlist.", item)
}

func (a *App) handleDelete(c *fiber.Ctx) error {
	userID := middlewares.UserID(c)

	id, err := a.Delete(c.Context(), userID, c.Params("id"))
	if err != nil {
		return err
	}

	return utils.OK(c, "Removed from wishlist.", generic.DeleteResponse{ID: id})
}

func (a *App) handleClear(c *fiber.Ctx) error {
	userID := middlewares.UserID(c)

	if err := a.Clear(c.Context(), userID); err != nil {
		return err
	}

	return utils.OK(c, "Wishlist cleared.", generic.SuccessResponse{Success: true})
}
