package cart

import (
	"net/http"

	"coursehunt-backend/internals/utils"

	"github.com/gofiber/fiber/v2"
)

// @Summary ListController
// @Description ListController for Cart
// @Tags Cart
// @Accept json
// @Produce json
// @Success 200 {object} utils.SwaggerResponse[[]CartItem]
// @Router /api/v1/carts [get]
func (c *CartModule) ListController(ctx *fiber.Ctx) error {
	list, err := c.ListRepository(utils.GetUserID(ctx))
	if err != nil {
		return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to fetch cart", nil, err.Error())
	}
	return utils.JSON(ctx, http.StatusOK, true, "cart fetched", list, nil)
}

// @Summary AddController
// @Description AddController for Cart
// @Tags Cart
// @Accept json
// @Produce json
// @Param courseID path string true "courseID"
// @Success 200 {object} utils.SwaggerResponse[CartItem]
// @Router /api/v1/carts [post]
func (c *CartModule) AddController(ctx *fiber.Ctx) error {
	var requestBody CreateCartRequest
	if ok, err := utils.Validate(ctx, &requestBody); !ok {
		return err
	}
	item, err := c.AddRepository(utils.GetUserID(ctx), requestBody.CourseId)
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
// @Param course_id query string true "Course ID"
// @Success 200 {object} utils.SwaggerResponse[utils.DeleteResponse]
// @Router /api/v1/carts/{id} [delete]
func (c *CartModule) RemoveController(ctx *fiber.Ctx) error {
	id, err := c.RemoveRepository(utils.GetUserID(ctx), ctx.Params("id"))
	if err != nil {
		return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to remove from cart", nil, err.Error())
	}

	return utils.JSON(ctx, http.StatusOK, true, "removed from cart", map[string]string{"id": id}, nil)
}

// @Summary ClearController
// @Description ClearController for Cart
// @Tags Cart
// @Accept json
// @Produce json
// @Success 200 {object} utils.SwaggerResponse[string]
// @Router /api/v1/carts/clear [delete]
func (c *CartModule) ClearController(ctx *fiber.Ctx) error {
	if err := c.ClearRepository(utils.GetUserID(ctx)); err != nil {
		return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to clear cart", nil, err.Error())
	}
	return utils.JSON(ctx, http.StatusOK, true, "cart cleared", nil, nil)
}
