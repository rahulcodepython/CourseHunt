package wishlist

import (
	"net/http"

	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (m *WishlistModule) ListController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	list, total, err := m.ListRepository(utils.GetUserID(c), page, limit)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "Failed to fetch wishlist.", nil, nil)
	}
	return utils.JSON(c, http.StatusOK, true, "Wishlist fetched.", models.PaginatedResponse[[]WishlistItem]{
		Data: list, Total: total, Page: page, Limit: limit,
	}, nil)
}

func (m *WishlistModule) CreateController(c *fiber.Ctx) error {
	var req CreateWishlistRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	item, err := m.CreateRepository(utils.GetUserID(c), req.CourseID)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "Failed to add to wishlist.", nil, nil)
	}
	return utils.JSON(c, http.StatusCreated, true, "Added to wishlist.", item, nil)
}

func (m *WishlistModule) DeleteController(c *fiber.Ctx) error {
	id, err := m.DeleteRepository(utils.GetUserID(c), c.Params("id"))
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "Failed to remove from wishlist.", nil, nil)
	}
	return utils.JSON(c, http.StatusOK, true, "Removed from wishlist.", models.DeleteResponse{ID: id}, nil)
}
