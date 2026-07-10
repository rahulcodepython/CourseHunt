package cart

import (
	"net/http"

	"coursehunt-backend/internals/utils"

	"github.com/gofiber/fiber/v2"
)

// @Summary AddController
// @Description AddController for Cart
// @Tags Cart
// @Accept json
// @Produce json
// @Param courseID path string true "courseID"
// @Success 200 {object} utils.SwaggerResponse[CartItem]
// @Router /api/v1/cart/course/{courseID} [post]
func (c *CartModule) AddController(ctx *fiber.Ctx) error {
	item, err := c.AddService(utils.GetUserID(ctx), ctx.Params("courseID"))
	if err != nil {
		return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to add to cart", nil, err.Error())
	}
	return utils.JSON(ctx, http.StatusOK, true, "added to cart", item, nil)
}

// @Summary RemoveController
// @Description RemoveController for Cart
// @Tags Cart
// @Accept json
// @Produce json
// @Param courseID path string true "courseID"
// @Success 200 {object} utils.SwaggerResponse[utils.DeleteResponse]
// @Router /api/v1/cart/course/{courseID} [delete]
func (c *CartModule) RemoveController(ctx *fiber.Ctx) error {
	id, err := c.RemoveService(utils.GetUserID(ctx), ctx.Params("courseID"))
	if err != nil {
		return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to remove from cart", nil, err.Error())
	}
	return utils.JSON(ctx, http.StatusOK, true, "removed from cart", map[string]string{"id": id}, nil)
}

// @Summary ListController
// @Description ListController for Cart
// @Tags Cart
// @Accept json
// @Produce json
// @Success 200 {object} utils.SwaggerResponse[[]CartItem]
// @Router /api/v1/cart [get]
func (c *CartModule) ListController(ctx *fiber.Ctx) error {
	list, err := c.ListService(utils.GetUserID(ctx))
	if err != nil {
		return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to fetch cart", nil, err.Error())
	}
	return utils.JSON(ctx, http.StatusOK, true, "cart fetched", list, nil)
}

// @Summary ClearController
// @Description ClearController for Cart
// @Tags Cart
// @Accept json
// @Produce json
// @Success 200 {object} utils.SwaggerResponse[]
// @Router /api/v1/cart [delete]
func (c *CartModule) ClearController(ctx *fiber.Ctx) error {
	if err := c.ClearService(utils.GetUserID(ctx)); err != nil {
		return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to clear cart", nil, err.Error())
	}
	return utils.JSON(ctx, http.StatusOK, true, "cart cleared", nil, nil)
}
