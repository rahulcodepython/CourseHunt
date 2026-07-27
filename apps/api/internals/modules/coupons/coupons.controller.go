package coupons

import (
	"fmt"
	"time"

	"coursehunt/api/internals/generic"
	"coursehunt/api/internals/utils"

	"github.com/gofiber/fiber/v2"
)

type couponListCacheData struct {
	Data  []Coupon `json:"data"`
	Total int      `json:"total"`
}

func (m *CouponsModule) ListController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	userID := utils.GetUserID(c)
	status := c.Query("status")
	isActive := c.Query("is_active")
	code := c.Query("code")

	cacheKey := fmt.Sprintf("coupons:list:p:%d:l:%d:u:%s:st:%s:ia:%s:c:%s", page, limit, userID, status, isActive, code)

	var cached couponListCacheData
	if hit, _ := m.Cache.Get(c.Context(), cacheKey, &cached); hit {
		return utils.OK(c, "Coupons fetched.", generic.PaginatedResponse[[]Coupon]{
			Data: cached.Data, Total: cached.Total, Page: page, Limit: limit,
		})
	}

	list, total, err := m.ListRepository(page, limit, userID, status, isActive, code)
	if err != nil {
		return utils.InternalError(c, "Failed to fetch coupons.", err)
	}

	_ = m.Cache.Set(c.Context(), cacheKey, couponListCacheData{Data: list, Total: total}, 5*time.Minute)

	return utils.OK(c, "Coupons fetched.", generic.PaginatedResponse[[]Coupon]{
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

	m.Cache.InvalidateCoupons(c.Context())

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

	m.Cache.InvalidateCoupons(c.Context())

	return utils.OK(c, "Coupon updated.", coupon)
}

func (m *CouponsModule) DeleteController(c *fiber.Ctx) error {
	userID := utils.GetUserID(c)
	id, err := m.DeleteRepository(c.Params("id"), userID)
	if err != nil {
		return utils.InternalError(c, "Failed to delete coupon.", err)
	}

	m.Cache.InvalidateCoupons(c.Context())

	return utils.OK(c, "Coupon deleted.", generic.DeleteResponse{ID: id})
}

func (m *CouponsModule) CheckController(c *fiber.Ctx) error {
	code := c.Query("code")
	courseID := c.Query("course_id")
	if code == "" || courseID == "" {
		return utils.BadRequest(c, "Code and course ID required.", nil)
	}

	cacheKey := fmt.Sprintf("coupons:check:c:%s:course:%s", code, courseID)
	var cached CouponCheckResponse
	if hit, _ := m.Cache.Get(c.Context(), cacheKey, &cached); hit {
		return utils.OK(c, "Coupon checked.", cached)
	}

	resp := m.CheckCoupon(code, courseID)
	_ = m.Cache.Set(c.Context(), cacheKey, resp, 3*time.Minute)

	return utils.OK(c, "Coupon checked.", resp)
}
