package controllers

import (
	"fmt"
	"time"

	"coursehunt/server/internals/config"
	"coursehunt/server/internals/entities"
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/repositories"
	"coursehunt/server/internals/services"
	"coursehunt/server/internals/utils"

	"github.com/gofiber/fiber/v2"
)

type CouponsController struct {
	Svc  *services.CouponsService
	Repo *repositories.CouponsRepository
	Cfg  *config.Config
}

func NewCouponsController(svc *services.CouponsService, repo *repositories.CouponsRepository, cfg *config.Config) *CouponsController {
	return &CouponsController{Svc: svc, Repo: repo, Cfg: cfg}
}

type couponListCacheData struct {
	Data  []entities.Coupon `json:"data"`
	Total int               `json:"total"`
}

func (ctrl *CouponsController) ListController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	userID := utils.GetUserID(c)
	status := c.Query("status")
	isActive := c.Query("is_active")
	code := c.Query("code")

	cacheKey := fmt.Sprintf("coupons:list:p:%d:l:%d:u:%s:st:%s:ia:%s:c:%s", page, limit, userID, status, isActive, code)

	var cached couponListCacheData
	if hit, _ := ctrl.Repo.Cache.Get(c.Context(), cacheKey, &cached); hit {
		return utils.OK(c, "Coupons fetched.", generic.PaginatedResponse[[]entities.Coupon]{
			Data: cached.Data, Total: cached.Total, Page: page, Limit: limit,
		})
	}

	list, total, err := ctrl.Repo.ListRepository(page, limit, userID, status, isActive, code)
	if err != nil {
		return utils.InternalError(c, "Failed to fetch coupons.", err)
	}

	_ = ctrl.Repo.Cache.Set(c.Context(), cacheKey, couponListCacheData{Data: list, Total: total}, 5*time.Minute)

	return utils.OK(c, "Coupons fetched.", generic.PaginatedResponse[[]entities.Coupon]{
		Data: list, Total: total, Page: page, Limit: limit,
	})
}

func (ctrl *CouponsController) CreateController(c *fiber.Ctx) error {
	var req entities.CreateCouponRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	userID := utils.GetUserID(c)
	coupon, err := ctrl.Repo.CreateRepository(userID, req)
	if err != nil {
		return utils.InternalError(c, "Failed to create coupon.", err)
	}

	ctrl.Repo.Cache.InvalidateCoupons(c.Context())

	return utils.Created(c, "Coupon created.", coupon)
}

func (ctrl *CouponsController) UpdateController(c *fiber.Ctx) error {
	var req entities.UpdateCouponRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	userID := utils.GetUserID(c)
	coupon, err := ctrl.Repo.UpdateRepository(c.Params("id"), userID, req)
	if err != nil {
		return utils.InternalError(c, "Failed to update coupon.", err)
	}

	ctrl.Repo.Cache.InvalidateCoupons(c.Context())

	return utils.OK(c, "Coupon updated.", coupon)
}

func (ctrl *CouponsController) DeleteController(c *fiber.Ctx) error {
	userID := utils.GetUserID(c)
	id, err := ctrl.Repo.DeleteRepository(c.Params("id"), userID)
	if err != nil {
		return utils.InternalError(c, "Failed to delete coupon.", err)
	}

	ctrl.Repo.Cache.InvalidateCoupons(c.Context())

	return utils.OK(c, "Coupon deleted.", generic.DeleteResponse{ID: id})
}

func (ctrl *CouponsController) CheckController(c *fiber.Ctx) error {
	code := c.Query("code")
	courseID := c.Query("course_id")
	if code == "" || courseID == "" {
		return utils.BadRequest(c, "Code and course ID required.", nil)
	}

	cacheKey := fmt.Sprintf("coupons:check:c:%s:course:%s", code, courseID)
	var cached entities.CouponCheckResponse
	if hit, _ := ctrl.Repo.Cache.Get(c.Context(), cacheKey, &cached); hit {
		return utils.OK(c, "Coupon checked.", cached)
	}

	resp := ctrl.Svc.CheckCoupon(code, courseID)
	_ = ctrl.Repo.Cache.Set(c.Context(), cacheKey, resp, 3*time.Minute)

	return utils.OK(c, "Coupon checked.", resp)
}
