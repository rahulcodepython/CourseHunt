package handlers

import (
	"net/http"

	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/services"
	"coursehunt-backend/internals/utils"
	"github.com/gofiber/fiber/v2"
)

type CouponHandler struct{ Svc *services.CouponService }

func NewCouponHandler() *CouponHandler { return &CouponHandler{Svc: services.NewCouponService()} }

func (h *CouponHandler) List(c *fiber.Ctx) error {
	page, limit := paginationParams(c)
	list, total, err := h.Svc.List(page, limit)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to fetch coupons", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "coupons fetched", models.PaginatedResponse{
		Data: list, Total: total, Page: page, Limit: limit,
	}, nil)
}

func (h *CouponHandler) Create(c *fiber.Ctx) error {
	var req models.CreateCouponRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	coupon, err := h.Svc.Create(getUserID(c), req)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to create coupon", nil, err.Error())
	}
	return utils.JSON(c, http.StatusCreated, true, "coupon created", coupon, nil)
}

func (h *CouponHandler) Update(c *fiber.Ctx) error {
	var req models.UpdateCouponRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	coupon, err := h.Svc.Update(c.Params("id"), req)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to update coupon", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "coupon updated", coupon, nil)
}

func (h *CouponHandler) Delete(c *fiber.Ctx) error {
	if err := h.Svc.Delete(c.Params("id")); err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to delete coupon", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "coupon deleted", nil, nil)
}

func (h *CouponHandler) Check(c *fiber.Ctx) error {
	code := c.Query("code")
	courseID := c.Query("course_id")
	if code == "" || courseID == "" {
		return utils.JSON(c, http.StatusBadRequest, false, "code and course_id required", nil, nil)
	}
	resp := h.Svc.Check(code, courseID)
	return utils.JSON(c, http.StatusOK, true, "coupon checked", resp, nil)
}
