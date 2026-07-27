package wishlist

import (
	"fmt"
	"time"

	"coursehunt/api/internals/generic"
	"coursehunt/api/internals/utils"

	"github.com/gofiber/fiber/v2"
)

type wishlistListCacheData struct {
	Data  []WishlistItem `json:"data"`
	Total int            `json:"total"`
}

func (m *WishlistModule) ListController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	userID := utils.GetUserID(c)
	cacheKey := fmt.Sprintf("wishlist:user:%s:p:%d:l:%d", userID, page, limit)

	var cached wishlistListCacheData
	if hit, _ := m.Cache.Get(c.Context(), cacheKey, &cached); hit {
		return utils.OK(c, "Wishlist fetched.", generic.PaginatedResponse[[]WishlistItem]{
			Data: cached.Data, Total: cached.Total, Page: page, Limit: limit,
		})
	}

	list, total, err := m.ListRepository(userID, page, limit)
	if err != nil {
		return utils.InternalError(c, "Failed to fetch wishlist.", err)
	}

	_ = m.Cache.Set(c.Context(), cacheKey, wishlistListCacheData{Data: list, Total: total}, 5*time.Minute)

	return utils.OK(c, "Wishlist fetched.", generic.PaginatedResponse[[]WishlistItem]{
		Data: list, Total: total, Page: page, Limit: limit,
	})
}

func (m *WishlistModule) CreateController(c *fiber.Ctx) error {
	var req CreateWishlistRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	userID := utils.GetUserID(c)
	item, err := m.CreateRepository(userID, req.CourseID)
	if err != nil {
		return utils.InternalError(c, "Failed to add to wishlist.", err)
	}

	m.Cache.InvalidateWishlist(c.Context(), userID)

	return utils.Created(c, "Added to wishlist.", item)
}

func (m *WishlistModule) DeleteController(c *fiber.Ctx) error {
	userID := utils.GetUserID(c)
	id, err := m.DeleteRepository(userID, c.Params("id"))
	if err != nil {
		return utils.InternalError(c, "Failed to remove from wishlist.", err)
	}

	m.Cache.InvalidateWishlist(c.Context(), userID)

	return utils.OK(c, "Removed from wishlist.", generic.DeleteResponse{ID: id})
}

func (m *WishlistModule) ClearController(c *fiber.Ctx) error {
	userID := utils.GetUserID(c)
	if err := m.ClearRepository(userID); err != nil {
		return utils.InternalError(c, "Failed to clear wishlist.", err)
	}

	m.Cache.InvalidateWishlist(c.Context(), userID)

	return utils.OK(c, "Wishlist cleared.", generic.SuccessResponse{Success: true})
}
