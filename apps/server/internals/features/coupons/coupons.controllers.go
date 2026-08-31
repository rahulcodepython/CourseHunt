package coupons

import (
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/middlewares"
	"coursehunt/server/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (a *App) handleList(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	userID := middlewares.UserID(c)
	scope := middlewares.ResolveScope(c)
	status := c.Query("status")
	isActive := c.Query("is_active")
	code := c.Query("code")

	list, total, err := a.List(c.Context(), page, limit, userID, scope, status, isActive, code)
	if err != nil {
		return err
	}

	return utils.OK(c, "Coupons fetched.", generic.PaginatedResponse[[]Coupon]{
		Data: list, Total: total, Page: page, Limit: limit,
	})
}

func (a *App) handleCreate(c *fiber.Ctx) error {
	var req CreateCouponRequest
	if err := utils.BindAndValidate(c, &req); err != nil {
		return err
	}
	userID := middlewares.UserID(c)
	scope := middlewares.ResolveScope(c)

	coupon, err := a.Create(c.Context(), userID, scope, req)
	if err != nil {
		return err
	}

	return utils.Created(c, "Coupon created.", coupon)
}

func (a *App) handleUpdate(c *fiber.Ctx) error {
	var req UpdateCouponRequest
	if err := utils.BindAndValidate(c, &req); err != nil {
		return err
	}
	userID := middlewares.UserID(c)
	scope := middlewares.ResolveScope(c)

	coupon, err := a.Update(c.Context(), c.Params("id"), userID, scope, req)
	if err != nil {
		return err
	}

	return utils.OK(c, "Coupon updated.", coupon)
}

func (a *App) handleDelete(c *fiber.Ctx) error {
	userID := middlewares.UserID(c)
	scope := middlewares.ResolveScope(c)

	id, err := a.Delete(c.Context(), c.Params("id"), userID, scope)
	if err != nil {
		return err
	}

	return utils.OK(c, "Coupon deleted.", generic.DeleteResponse{ID: id})
}

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
