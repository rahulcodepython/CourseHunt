package coupons

import (
	"net/http"

	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (m *CouponsModule) ListController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	list, total, err := m.ListService(page, limit)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to fetch coupons", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "coupons fetched", models.PaginatedResponse{
		Data: list, Total: total, Page: page, Limit: limit,
	}, nil)
}

func (m *CouponsModule) CreateController(c *fiber.Ctx) error {
	var req CreateCouponRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	coupon, err := m.CreateService(getUserID(c), req)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to create coupon", nil, err.Error())
	}
	return utils.JSON(c, http.StatusCreated, true, "coupon created", coupon, nil)
}

func (m *CouponsModule) UpdateController(c *fiber.Ctx) error {
	var req UpdateCouponRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	coupon, err := m.UpdateService(c.Params("id"), req)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to update coupon", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "coupon updated", coupon, nil)
}

func (m *CouponsModule) DeleteController(c *fiber.Ctx) error {
	if err := m.DeleteService(c.Params("id")); err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to delete coupon", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "coupon deleted", map[string]string{"id": c.Params("id")}, nil)
}

func (m *CouponsModule) CheckController(c *fiber.Ctx) error {
	code := c.Query("code")
	courseID := c.Query("course_id")
	if code == "" || courseID == "" {
		return utils.JSON(c, http.StatusBadRequest, false, "code and course_id required", nil, nil)
	}
	resp := m.CheckService(code, courseID)
	return utils.JSON(c, http.StatusOK, true, "coupon checked", resp, nil)
}

// getUserID extracts the user ID from locals (assuming auth middleware sets it)
func getUserID(c *fiber.Ctx) string {
	val := c.Locals("user_id")
	if val == nil {
		return ""
	}
	return val.(string)
}
