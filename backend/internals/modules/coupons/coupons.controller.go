package coupons

import (
	"net/http"

	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/utils"

	"github.com/gofiber/fiber/v2"
)

// @Summary ListController
// @Description ListController for Coupons
// @Tags Coupons
// @Accept json
// @Produce json
// @Success 200 {object} utils.PaginatedResponse[Coupon]
// @Router /api/v1/coupons [get]
func (m *CouponsModule) ListController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	list, total, err := m.ListService(page, limit)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to fetch coupons", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "coupons fetched", models.PaginatedResponse[[]Coupon]{
		Data: list, Total: total, Page: page, Limit: limit,
	}, nil)
}

// @Summary CreateController
// @Description CreateController for Coupons
// @Tags Coupons
// @Accept json
// @Produce json
// @Param body body coupons.CreateCouponRequest true "Request Body"
// @Success 200 {object} utils.SwaggerResponse[Coupon]
// @Router /api/v1/coupons [post]
func (m *CouponsModule) CreateController(c *fiber.Ctx) error {
	var req CreateCouponRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	coupon, err := m.CreateService(utils.GetUserID(c), req)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to create coupon", nil, err.Error())
	}
	return utils.JSON(c, http.StatusCreated, true, "coupon created", coupon, nil)
}

// @Summary UpdateController
// @Description UpdateController for Coupons
// @Tags Coupons
// @Accept json
// @Produce json
// @Param id path string true "id"
// @Param body body coupons.UpdateCouponRequest true "Request Body"
// @Success 200 {object} utils.SwaggerResponse[Coupon]
// @Router /api/v1/coupons/{id} [patch]
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

// @Summary DeleteController
// @Description DeleteController for Coupons
// @Tags Coupons
// @Accept json
// @Produce json
// @Param id path string true "id"
// @Success 200 {object} utils.SwaggerResponse[utils.DeleteResponse]
// @Router /api/v1/coupons/{id} [delete]
func (m *CouponsModule) DeleteController(c *fiber.Ctx) error {
	id, err := m.DeleteService(c.Params("id"))
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to delete coupon", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "coupon deleted", map[string]string{"id": id}, nil)
}

// @Summary CheckController
// @Description CheckController for Coupons
// @Tags Coupons
// @Accept json
// @Produce json
// @Success 200 {object} utils.SwaggerResponse[CouponCheckResponse]
// @Router /api/v1/coupons/check [get]
func (m *CouponsModule) CheckController(c *fiber.Ctx) error {
	code := c.Query("code")
	courseID := c.Query("course_id")
	if code == "" || courseID == "" {
		return utils.JSON(c, http.StatusBadRequest, false, "code and course_id required", nil, nil)
	}
	resp := m.CheckService(code, courseID)
	return utils.JSON(c, http.StatusOK, true, "coupon checked", resp, nil)
}
