package wishlist

import (
	"coursehunt/api/internals/generic"
	"coursehunt/api/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (m *WishlistModule) ListController(c *fiber.Ctx) error {
	list, err := m.ListRepository(utils.GetUserID(c))
	if err != nil {
		return utils.InternalError(c, "Failed to fetch wishlist.", err)
	}
	return utils.OK(c, "Wishlist fetched.", list)
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
	return utils.OK(c, "Removed from wishlist.", generic.DeleteResponse{ID: id})
}

func (m *WishlistModule) ClearController(c *fiber.Ctx) error {
	if err := m.ClearRepository(utils.GetUserID(c)); err != nil {
		return utils.InternalError(c, "Failed to clear wishlist.", err)
	}
	return utils.OK(c, "Wishlist cleared.", generic.SuccessResponse{Success: true})
}
