package wishlist

import (
	"net/http"

	"coursehunt-backend/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (m *WishlistModule) CreateController(ctx *fiber.Ctx) error {
	item, err := m.CreateService(utils.GetUserID(ctx), ctx.Params("courseID"))
	if err != nil {
		return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to add to wishlist", nil, err.Error())
	}
	return utils.JSON(ctx, http.StatusCreated, true, "added to wishlist", item, nil)
}

func (m *WishlistModule) DeleteController(ctx *fiber.Ctx) error {
	if err := m.DeleteService(utils.GetUserID(ctx), ctx.Params("courseID")); err != nil {
		return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to remove from wishlist", nil, err.Error())
	}
	return utils.JSON(ctx, http.StatusOK, true, "removed from wishlist", nil, nil)
}

func (m *WishlistModule) ListController(ctx *fiber.Ctx) error {
	list, err := m.ListService(utils.GetUserID(ctx))
	if err != nil {
		return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to fetch wishlist", nil, err.Error())
	}
	return utils.JSON(ctx, http.StatusOK, true, "wishlist fetched", list, nil)
}
