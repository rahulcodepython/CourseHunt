package controllers

import (
	"fmt"
	"time"

	"coursehunt/server/internals/config"
	"coursehunt/server/internals/entities"
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/repositories"
	"coursehunt/server/internals/utils"

	"github.com/gofiber/fiber/v2"
)

type WishlistController struct {
	Repo *repositories.WishlistRepository
	Cfg  *config.Config
}

func NewWishlistController(repo *repositories.WishlistRepository, cfg *config.Config) *WishlistController {
	return &WishlistController{Repo: repo, Cfg: cfg}
}

type wishlistListCacheData struct {
	Data  []entities.WishlistItem `json:"data"`
	Total int                     `json:"total"`
}

func (ctrl *WishlistController) ListController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	userID := utils.GetUserID(c)
	cacheKey := fmt.Sprintf("wishlist:user:%s:p:%d:l:%d", userID, page, limit)

	var cached wishlistListCacheData
	if hit, _ := ctrl.Repo.Cache.Get(c.Context(), cacheKey, &cached); hit {
		return utils.OK(c, "Wishlist fetched.", generic.PaginatedResponse[[]entities.WishlistItem]{
			Data: cached.Data, Total: cached.Total, Page: page, Limit: limit,
		})
	}

	list, total, err := ctrl.Repo.ListRepository(userID, page, limit)
	if err != nil {
		return utils.InternalError(c, "Failed to fetch wishlist.", err)
	}

	_ = ctrl.Repo.Cache.Set(c.Context(), cacheKey, wishlistListCacheData{Data: list, Total: total}, 5*time.Minute)

	return utils.OK(c, "Wishlist fetched.", generic.PaginatedResponse[[]entities.WishlistItem]{
		Data: list, Total: total, Page: page, Limit: limit,
	})
}

func (ctrl *WishlistController) CreateController(c *fiber.Ctx) error {
	var req entities.CreateWishlistRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	userID := utils.GetUserID(c)
	item, err := ctrl.Repo.CreateRepository(userID, req.CourseID)
	if err != nil {
		return utils.InternalError(c, "Failed to add to wishlist.", err)
	}

	ctrl.Repo.Cache.InvalidateWishlist(c.Context(), userID)

	return utils.Created(c, "Added to wishlist.", item)
}

func (ctrl *WishlistController) DeleteController(c *fiber.Ctx) error {
	userID := utils.GetUserID(c)
	id, err := ctrl.Repo.DeleteRepository(userID, c.Params("id"))
	if err != nil {
		return utils.InternalError(c, "Failed to remove from wishlist.", err)
	}

	ctrl.Repo.Cache.InvalidateWishlist(c.Context(), userID)

	return utils.OK(c, "Removed from wishlist.", generic.DeleteResponse{ID: id})
}

func (ctrl *WishlistController) ClearController(c *fiber.Ctx) error {
	userID := utils.GetUserID(c)
	if err := ctrl.Repo.ClearRepository(userID); err != nil {
		return utils.InternalError(c, "Failed to clear wishlist.", err)
	}

	ctrl.Repo.Cache.InvalidateWishlist(c.Context(), userID)

	return utils.OK(c, "Wishlist cleared.", generic.SuccessResponse{Success: true})
}
