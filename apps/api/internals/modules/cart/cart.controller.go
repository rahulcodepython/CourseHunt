package cart

import (
	"coursehunt/api/internals/generic"
	"coursehunt/api/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (m *CartModule) ListController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	list, total, err := m.ListRepository(utils.GetUserID(c), page, limit)
	if err != nil {
		return utils.InternalError(c, "Failed to fetch cart.", err)
	}
	return utils.OK(c, "Cart fetched.", generic.PaginatedResponse[[]CartItem]{
		Data: list, Total: total, Page: page, Limit: limit,
	})
}

func (m *CartModule) AddController(c *fiber.Ctx) error {
	var requestBody CreateCartRequest
	if ok, err := utils.Validate(c, &requestBody); !ok {
		return err
	}
	item, err := m.AddRepository(utils.GetUserID(c), requestBody.CourseId)
	if err != nil {
		return utils.InternalError(c, "Failed to add to cart.", err)
	}
	return utils.OK(c, "Added to cart.", item)
}

func (m *CartModule) RemoveController(c *fiber.Ctx) error {
	id, err := m.RemoveRepository(utils.GetUserID(c), c.Params("id"))
	if err != nil {
		return utils.InternalError(c, "Failed to remove from cart.", err)
	}

	return utils.OK(c, "Removed from cart.", generic.DeleteResponse{ID: id})
}

func (m *CartModule) ClearController(c *fiber.Ctx) error {
	if err := m.ClearRepository(utils.GetUserID(c)); err != nil {
		return utils.InternalError(c, "Failed to clear cart.", err)
	}
	return utils.OK(c, "Cart cleared.", generic.SuccessResponse{Success: true})
}
