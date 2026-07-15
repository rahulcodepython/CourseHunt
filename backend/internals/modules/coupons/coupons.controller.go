package coupons

import (
	"net/http"

	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (m *CouponsModule) ListController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	userID := utils.GetUserID(c)
	list, total, err := m.ListRepository(page, limit, userID, c.Query("status"), c.Query("is_active"), c.Query("code"))
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "Failed to fetch coupons.", nil, nil)
	}
	return utils.JSON(c, http.StatusOK, true, "Coupons fetched.", models.PaginatedResponse[[]Coupon]{
		Data: list, Total: total, Page: page, Limit: limit,
	}, nil)
}

func (m *CouponsModule) CreateController(c *fiber.Ctx) error {
	var req CreateCouponRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	userID := utils.GetUserID(c)
	coupon, err := m.CreateRepository(userID, req)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "Failed to create coupon.", nil, nil)
	}
	return utils.JSON(c, http.StatusCreated, true, "Coupon created.", coupon, nil)
}

func (m *CouponsModule) UpdateController(c *fiber.Ctx) error {
	var req UpdateCouponRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	userID := utils.GetUserID(c)
	coupon, err := m.UpdateRepository(c.Params("id"), userID, req)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "Failed to update coupon.", nil, nil)
	}
	return utils.JSON(c, http.StatusOK, true, "Coupon updated.", coupon, nil)
}

func (m *CouponsModule) DeleteController(c *fiber.Ctx) error {
	userID := utils.GetUserID(c)
	id, err := m.DeleteRepository(c.Params("id"), userID)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "Failed to delete coupon.", nil, nil)
	}
	return utils.JSON(c, http.StatusOK, true, "Coupon deleted.", models.DeleteResponse{ID: id}, nil)
}

func (m *CouponsModule) CheckController(c *fiber.Ctx) error {
	code := c.Query("code")
	courseID := c.Query("course_id")
	if code == "" || courseID == "" {
		return utils.JSON(c, http.StatusBadRequest, false, "Code and course ID required.", nil, nil)
	}
	resp := m.CheckCoupon(code, courseID)
	return utils.JSON(c, http.StatusOK, true, "Coupon checked.", resp, nil)
}
