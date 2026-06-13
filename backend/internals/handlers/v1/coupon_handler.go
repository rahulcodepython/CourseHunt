package v1

import (
	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/services"
	"coursehunt-backend/internals/utils"
	"github.com/gofiber/fiber/v2"
)

type CouponHandler struct {
	Coupons *services.CouponService
}

func NewCouponHandler() *CouponHandler {
	return &CouponHandler{Coupons: services.NewCouponService()}
}

func (h *CouponHandler) CouponsList(c *fiber.Ctx) error {
	coupons, err := h.Coupons.List()
	if err != nil {
		return utils.InternalError(c, "Failed to fetch coupons")
	}
	return utils.OK(c, "Coupons fetched successfully", coupons)
}

func (h *CouponHandler) CheckCoupon(c *fiber.Ctx) error {
	var body struct {
		Code string `json:"code"`
	}
	if err := c.BodyParser(&body); err != nil || body.Code == "" {
		return utils.OK(c, "Invalid request", fiber.Map{"applied": false, "message": "Coupon code is required"})
	}
	coupon, err := h.Coupons.Check(body.Code)
	if err != nil {
		return utils.OK(c, "Coupon invalid", fiber.Map{"applied": false, "message": err.Error()})
	}
	return utils.OK(c, "Coupon checked successfully", fiber.Map{"applied": true, "message": "Coupon applied successfully", "coupon": coupon})
}

func (h *CouponHandler) CreateCoupon(c *fiber.Ctx) error {
	var coupon models.Coupon
	if err := c.BodyParser(&coupon); err != nil {
		return utils.BadRequest(c, "Invalid request body")
	}
	created, err := h.Coupons.Create(&coupon)
	if err != nil {
		return utils.InternalError(c, "Failed to create coupon")
	}
	return utils.Created(c, "Coupon created successfully", fiber.Map{"coupon": created})
}

func (h *CouponHandler) UpdateCoupon(c *fiber.Ctx) error {
	id, err := idParam(c)
	if err != nil {
		return utils.BadRequest(c, "Invalid coupon ID")
	}
	var coupon models.Coupon
	if err := c.BodyParser(&coupon); err != nil {
		return utils.BadRequest(c, "Invalid request body")
	}
	updated, err := h.Coupons.Update(id, &coupon)
	if err != nil {
		return utils.InternalError(c, "Failed to update coupon")
	}
	return utils.OK(c, "Coupon updated successfully", fiber.Map{"coupon": updated})
}

func (h *CouponHandler) DeleteCoupon(c *fiber.Ctx) error {
	id, err := idParam(c)
	if err != nil {
		return utils.BadRequest(c, "Invalid coupon ID")
	}
	if err := h.Coupons.Delete(id); err != nil {
		return utils.InternalError(c, "Failed to delete coupon")
	}
	return utils.OK(c, "Coupon deleted successfully", fiber.Map{"message": "Coupon deleted successfully"})
}
