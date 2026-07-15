package coupons

import (
	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (m *CouponsModule) ListController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	userID := utils.GetUserID(c)
	list, total, err := m.ListRepository(page, limit, userID, c.Query("status"), c.Query("is_active"), c.Query("code"))
	if err != nil {
		return utils.InternalError(c, "Failed to fetch coupons.", err)
	}
	return utils.OK(c, "Coupons fetched.", models.PaginatedResponse[[]Coupon]{
		Data: list, Total: total, Page: page, Limit: limit,
	})
}

func (m *CouponsModule) CreateController(c *fiber.Ctx) error {
	var req CreateCouponRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	userID := utils.GetUserID(c)
	coupon, err := m.CreateRepository(userID, req)
	if err != nil {
		return utils.InternalError(c, "Failed to create coupon.", err)
	}
	return utils.Created(c, "Coupon created.", coupon)
}

func (m *CouponsModule) UpdateController(c *fiber.Ctx) error {
	var req UpdateCouponRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	userID := utils.GetUserID(c)
	coupon, err := m.UpdateRepository(c.Params("id"), userID, req)
	if err != nil {
		return utils.InternalError(c, "Failed to update coupon.", err)
	}
	return utils.OK(c, "Coupon updated.", coupon)
}

func (m *CouponsModule) DeleteController(c *fiber.Ctx) error {
	userID := utils.GetUserID(c)
	id, err := m.DeleteRepository(c.Params("id"), userID)
	if err != nil {
		return utils.InternalError(c, "Failed to delete coupon.", err)
	}
	return utils.OK(c, "Coupon deleted.", models.DeleteResponse{ID: id})
}

func (m *CouponsModule) CheckController(c *fiber.Ctx) error {
	code := c.Query("code")
	courseID := c.Query("course_id")
	if code == "" || courseID == "" {
		return utils.BadRequest(c, "Code and course ID required.", nil)
	}
	resp := m.CheckCoupon(code, courseID)
	return utils.OK(c, "Coupon checked.", resp)
}
