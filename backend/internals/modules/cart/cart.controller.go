package cart

import (
	"net/http"

	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (m *CartModule) ListController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	list, total, err := m.ListRepository(utils.GetUserID(c), page, limit)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "Failed to fetch cart.", nil, nil)
	}
	return utils.JSON(c, http.StatusOK, true, "Cart fetched.", models.PaginatedResponse[[]CartItem]{
		Data: list, Total: total, Page: page, Limit: limit,
	}, nil)
}

func (m *CartModule) AddController(c *fiber.Ctx) error {
	var requestBody CreateCartRequest
	if ok, err := utils.Validate(c, &requestBody); !ok {
		return err
	}
	item, err := m.AddRepository(utils.GetUserID(c), requestBody.CourseId)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "Failed to add to cart.", nil, nil)
	}
	return utils.JSON(c, http.StatusOK, true, "Added to cart.", item, nil)
}

func (m *CartModule) RemoveController(c *fiber.Ctx) error {
	id, err := m.RemoveRepository(utils.GetUserID(c), c.Params("id"))
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "Failed to remove from cart.", nil, nil)
	}

	return utils.JSON(c, http.StatusOK, true, "Removed from cart.", models.DeleteResponse{ID: id}, nil)
}

func (m *CartModule) ClearController(c *fiber.Ctx) error {
	if err := m.ClearRepository(utils.GetUserID(c)); err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "Failed to clear cart.", nil, nil)
	}
	return utils.JSON(c, http.StatusOK, true, "Cart cleared.", models.SuccessResponse{Success: true}, nil)
}
