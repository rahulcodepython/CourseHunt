package wishlist

import (
	"net/http"

	"coursehunt-backend/internals/utils"

	"github.com/gofiber/fiber/v2"
)

// @Summary ListController
// @Description ListController for Wishlist
// @Tags Wishlist
// @Accept json
// @Produce json
// @Success 200 {object} utils.SwaggerResponse[[]WishlistItem]
// @Router /api/v1/wishlist [get]
func (m *WishlistModule) ListController(ctx *fiber.Ctx) error {
	list, err := m.ListRepository(utils.GetUserID(ctx))
	if err != nil {
		return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to fetch wishlist", nil, err.Error())
	}
	return utils.JSON(ctx, http.StatusOK, true, "wishlist fetched", list, nil)
}

// @Summary CreateController
// @Description CreateController for Wishlist
// @Tags Wishlist
// @Accept json
// @Produce json
// @Param body body wishlist.CreateWishlistRequest true "Request Body"
// @Success 200 {object} utils.SwaggerResponse[WishlistItem]
// @Router /api/v1/wishlist [post]
func (m *WishlistModule) CreateController(ctx *fiber.Ctx) error {
	var req CreateWishlistRequest
	if ok, err := utils.Validate(ctx, &req); !ok {
		return err
	}
	item, err := m.CreateRepository(utils.GetUserID(ctx), req.CourseID)
	if err != nil {
		return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to add to wishlist", nil, err.Error())
	}
	return utils.JSON(ctx, http.StatusCreated, true, "added to wishlist", item, nil)
}

// @Summary DeleteController
// @Description DeleteController for Wishlist
// @Tags Wishlist
// @Accept json
// @Produce json
// @Param id path string true "id"
// @Success 200 {object} utils.SwaggerResponse[utils.DeleteResponse]
// @Router /api/v1/wishlist/{id} [delete]
func (m *WishlistModule) DeleteController(ctx *fiber.Ctx) error {
	id, err := m.DeleteRepository(utils.GetUserID(ctx), ctx.Params("id"))
	if err != nil {
		return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to remove from wishlist", nil, err.Error())
	}
	return utils.JSON(ctx, http.StatusOK, true, "removed from wishlist", map[string]string{"id": id}, nil)
}
