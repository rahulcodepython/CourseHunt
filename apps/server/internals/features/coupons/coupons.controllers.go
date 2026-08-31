package coupons

import (
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/middlewares"
	"coursehunt/server/internals/utils"

	"github.com/gofiber/fiber/v2"
)

// --- Admin Handlers ---

func (a *App) handleAdminList(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	status := c.Query("status")
	isActive := c.Query("is_active")
	code := c.Query("code")

	list, total, err := a.AdminList(c.Context(), page, limit, status, isActive, code)
	if err != nil {
		return err
	}

	return utils.OK(c, "Coupons fetched.", generic.PaginatedResponse[[]Coupon]{
		Data: list, Total: total, Page: page, Limit: limit,
	})
}

func (a *App) handleAdminCreate(c *fiber.Ctx) error {
	var req CreateCouponRequest
	if err := utils.BindAndValidate(c, &req); err != nil {
		return err
	}
	userID := middlewares.UserID(c)

	coupon, err := a.AdminCreate(c.Context(), userID, req)
	if err != nil {
		return err
	}

	return utils.Created(c, "Coupon created.", coupon)
}

func (a *App) handleAdminUpdate(c *fiber.Ctx) error {
	var req UpdateCouponRequest
	if err := utils.BindAndValidate(c, &req); err != nil {
		return err
	}

	coupon, err := a.AdminUpdate(c.Context(), c.Params("id"), req)
	if err != nil {
		return err
	}

	return utils.OK(c, "Coupon updated.", coupon)
}

func (a *App) handleAdminDelete(c *fiber.Ctx) error {
	id, err := a.AdminDelete(c.Context(), c.Params("id"))
	if err != nil {
		return err
	}

	return utils.OK(c, "Coupon deleted.", generic.DeleteResponse{ID: id})
}

// --- Tutor Handlers ---

func (a *App) handleTutorList(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	userID := middlewares.UserID(c)
	status := c.Query("status")
	isActive := c.Query("is_active")
	code := c.Query("code")

	list, total, err := a.TutorList(c.Context(), page, limit, userID, status, isActive, code)
	if err != nil {
		return err
	}

	return utils.OK(c, "Coupons fetched.", generic.PaginatedResponse[[]Coupon]{
		Data: list, Total: total, Page: page, Limit: limit,
	})
}

func (a *App) handleTutorCreate(c *fiber.Ctx) error {
	var req CreateCouponRequest
	if err := utils.BindAndValidate(c, &req); err != nil {
		return err
	}
	userID := middlewares.UserID(c)

	coupon, err := a.TutorCreate(c.Context(), userID, req)
	if err != nil {
		return err
	}

	return utils.Created(c, "Coupon created.", coupon)
}

func (a *App) handleTutorUpdate(c *fiber.Ctx) error {
	var req UpdateCouponRequest
	if err := utils.BindAndValidate(c, &req); err != nil {
		return err
	}
	userID := middlewares.UserID(c)

	coupon, err := a.TutorUpdate(c.Context(), c.Params("id"), userID, req)
	if err != nil {
		return err
	}

	return utils.OK(c, "Coupon updated.", coupon)
}

func (a *App) handleTutorDelete(c *fiber.Ctx) error {
	userID := middlewares.UserID(c)

	id, err := a.TutorDelete(c.Context(), c.Params("id"), userID)
	if err != nil {
		return err
	}

	return utils.OK(c, "Coupon deleted.", generic.DeleteResponse{ID: id})
}

// --- Public / Checkout Handlers ---

func (a *App) handleCheck(c *fiber.Ctx) error {
	code := c.Query("code")
	courseID := c.Query("course_id")
	if code == "" || courseID == "" {
		return utils.ErrBadRequest("Code and course ID required.", nil)
	}
	if len(code) > 50 {
		return utils.ErrBadRequest("Invalid coupon code.", nil)
	}

	resp := a.Check(c.Context(), code, courseID)

	return utils.OK(c, "Coupon checked.", resp)
}
