package wishlist

import (
	"coursehunt/api/internals/models"
	"coursehunt/api/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (m *WishlistModule) ListController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	list, total, err := m.ListRepository(utils.GetUserID(c), page, limit)
	if err != nil {
		return utils.InternalError(c, "Failed to fetch wishlist.", err)
	}
	return utils.OK(c, "Wishlist fetched.", models.PaginatedResponse[[]WishlistItem]{
		Data: list, Total: total, Page: page, Limit: limit,
	})
}

func (m *WishlistModule) CreateController(c *fiber.Ctx) error {
	var req CreateWishlistRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	item, err := m.CreateRepository(utils.GetUserID(c), req.CourseID)
	if err != nil {
		return utils.InternalError(c, "Failed to add to wishlist.", err)
	}
	return utils.Created(c, "Added to wishlist.", item)
}

func (m *WishlistModule) DeleteController(c *fiber.Ctx) error {
	id, err := m.DeleteRepository(utils.GetUserID(c), c.Params("id"))
	if err != nil {
		return utils.InternalError(c, "Failed to remove from wishlist.", err)
	}
	return utils.OK(c, "Removed from wishlist.", models.DeleteResponse{ID: id})
}
