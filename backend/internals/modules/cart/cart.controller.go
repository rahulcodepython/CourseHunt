package cart

import (
	"net/http"

	"coursehunt-backend/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (c *CartModule) AddController(ctx *fiber.Ctx) error {
	item, err := c.AddService(utils.GetUserID(ctx), ctx.Params("courseID"))
	if err != nil {
		return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to add to cart", nil, err.Error())
	}
	return utils.JSON(ctx, http.StatusOK, true, "added to cart", item, nil)
}

func (c *CartModule) RemoveController(ctx *fiber.Ctx) error {
	id, err := c.RemoveService(utils.GetUserID(ctx), ctx.Params("courseID"))
	if err != nil {
		return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to remove from cart", nil, err.Error())
	}
	return utils.JSON(ctx, http.StatusOK, true, "removed from cart", map[string]string{"id": id}, nil)
}

func (c *CartModule) ListController(ctx *fiber.Ctx) error {
	list, err := c.ListService(utils.GetUserID(ctx))
	if err != nil {
		return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to fetch cart", nil, err.Error())
	}
	return utils.JSON(ctx, http.StatusOK, true, "cart fetched", list, nil)
}

func (c *CartModule) ClearController(ctx *fiber.Ctx) error {
	if err := c.ClearService(utils.GetUserID(ctx)); err != nil {
		return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to clear cart", nil, err.Error())
	}
	return utils.JSON(ctx, http.StatusOK, true, "cart cleared", []interface{}{}, nil)
}
