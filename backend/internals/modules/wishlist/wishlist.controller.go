package wishlist

import (
	"net/http"

	"coursehunt-backend/internals/utils"

	"github.com/gofiber/fiber/v2"
)

// @Summary CreateController
// @Description CreateController for Wishlist
// @Tags Wishlist
// @Accept json
// @Produce json
// @Param courseID path string true "courseID"
// @Success 200 {object} utils.SwaggerResponse[Wishlist]
// @Router /api/v1/wishlist/course/{courseID} [post]
func (m *WishlistModule) CreateController(ctx *fiber.Ctx) error {
	item, err := m.CreateService(utils.GetUserID(ctx), ctx.Params("courseID"))
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
// @Param courseID path string true "courseID"
// @Success 200 {object} utils.SwaggerResponse[utils.DeleteResponse]
// @Router /api/v1/wishlist/course/{courseID} [delete]
func (m *WishlistModule) DeleteController(ctx *fiber.Ctx) error {
	id, err := m.DeleteService(utils.GetUserID(ctx), ctx.Params("courseID"))
	if err != nil {
		return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to remove from wishlist", nil, err.Error())
	}
	return utils.JSON(ctx, http.StatusOK, true, "removed from wishlist", map[string]string{"id": id}, nil)
}

// @Summary ListController
// @Description ListController for Wishlist
// @Tags Wishlist
// @Accept json
// @Produce json
// @Success 200 {object} utils.SwaggerResponse[[]Wishlist]
// @Router /api/v1/wishlist [get]
func (m *WishlistModule) ListController(ctx *fiber.Ctx) error {
	list, err := m.ListService(utils.GetUserID(ctx))
	if err != nil {
		return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to fetch wishlist", nil, err.Error())
	}
	return utils.JSON(ctx, http.StatusOK, true, "wishlist fetched", list, nil)
}
