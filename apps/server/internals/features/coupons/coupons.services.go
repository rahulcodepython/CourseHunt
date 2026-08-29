package coupons

import (
	"context"
	"errors"
	"fmt"
	"net/url"
	"time"

	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/utils"
)

type couponListCacheData struct {
	Data  []Coupon `json:"data"`
	Total int      `json:"total"`
}

func (a *App) List(ctx context.Context, page, limit int, userID string, scope generic.AuthScope, status, isActive, code string) ([]Coupon, int, error) {
	cacheKey := fmt.Sprintf("coupons:list:p:%d:l:%d:u:%s:s:%v:st:%s:ia:%s:c:%s", page, limit, userID, scope, status, isActive, code)

	var cached couponListCacheData
	if hit, _ := a.Cache.Get(ctx, cacheKey, &cached); hit {
		return cached.Data, cached.Total, nil
	}

	list, total, err := a.ListRepository(ctx, page, limit, userID, scope, status, isActive, code)
	if err != nil {
		return nil, 0, utils.ErrInternal("Failed to fetch coupons.", err)
	}

	_ = a.Cache.Set(ctx, cacheKey, couponListCacheData{Data: list, Total: total}, 5*time.Minute)

	return list, total, nil
}

func (a *App) Create(ctx context.Context, userID string, scope generic.AuthScope, req CreateCouponRequest) (*Coupon, error) {
	coupon, err := a.CreateRepository(ctx, userID, scope, req)
	if err != nil {
		if errors.Is(err, generic.ErrCouponsCourseNotFound) {
			return nil, utils.ErrNotFound("Course not found.", err)
		}
		if errors.Is(err, generic.ErrCouponsUnauthorized) {
			return nil, utils.ErrForbidden("Access denied. You do not own this course.", err)
		}
		if errors.Is(err, generic.ErrCouponsCourseRequired) {
			return nil, utils.ErrBadRequest("Course is required for tutor-created coupons.", err)
		}
		return nil, utils.ErrInternal("Failed to create coupon.", err)
	}

	a.Cache.InvalidateCoupons(ctx)

	return coupon, nil
}

func (a *App) Update(ctx context.Context, id, userID string, scope generic.AuthScope, req UpdateCouponRequest) (*Coupon, error) {
	coupon, err := a.UpdateRepository(ctx, id, userID, scope, req)
	if err != nil {
		if errors.Is(err, generic.ErrCouponNotFound) {
			return nil, utils.ErrNotFound("Coupon not found.", err)
		}
		if errors.Is(err, generic.ErrCouponsUnauthorized) {
			return nil, utils.ErrForbidden("Access denied. You do not own this coupon.", err)
		}
		return nil, utils.ErrInternal("Failed to update coupon.", err)
	}

	a.Cache.InvalidateCoupons(ctx)

	return coupon, nil
}

func (a *App) Delete(ctx context.Context, id, userID string, scope generic.AuthScope) (string, error) {
	deletedID, err := a.DeleteRepository(ctx, id, userID, scope)
	if err != nil {
		if errors.Is(err, generic.ErrCouponNotFound) {
			return "", utils.ErrNotFound("Coupon not found.", err)
		}
		if errors.Is(err, generic.ErrCouponsUnauthorized) {
			return "", utils.ErrForbidden("Access denied. You do not own this coupon.", err)
		}
		return "", utils.ErrInternal("Failed to delete coupon.", err)
	}

	a.Cache.InvalidateCoupons(ctx)

	return deletedID, nil
}

func reasonPtr(s string) *string { return &s }

// ValidateAndFetchCoupon validates a coupon code against a course and
// returns both the check result and the underlying coupon row. This is the
// one exported method the transactions feature calls across the feature
// boundary (transactions.InitiateService, to price a checkout) — see
// coupons.App threaded into transactions.New.
func (a *App) ValidateAndFetchCoupon(ctx context.Context, code, courseID string) (CouponCheckResponse, *Coupon, error) {
	c, err := a.ReadByCodeRepository(ctx, code)
	if err != nil {
		return CouponCheckResponse{Valid: false, Reason: reasonPtr("not_found")}, nil, nil
	}
	if !c.IsActive {
		return CouponCheckResponse{Valid: false, DiscountPercent: c.DiscountPercent, Reason: reasonPtr("inactive")}, c, nil
	}
	if time.Now().After(c.ExpiresAt) {
		return CouponCheckResponse{Valid: false, DiscountPercent: c.DiscountPercent, Reason: reasonPtr("expired")}, c, nil
	}
	if c.UsageCount >= c.MaxUsage {
		return CouponCheckResponse{Valid: false, DiscountPercent: c.DiscountPercent, Reason: reasonPtr("max_usage_reached")}, c, nil
	}
	if c.Course.ID != "" && c.Course.ID != courseID {
		return CouponCheckResponse{Valid: false, DiscountPercent: c.DiscountPercent, Reason: reasonPtr("not_applicable")}, c, nil
	}
	// Free courses (and any course a tutor/admin has explicitly opted out of
	// coupons for) never accept a coupon, regardless of which coupon it is.
	if allowed, err := a.CourseAllowsCouponRepository(ctx, courseID); err != nil || !allowed {
		return CouponCheckResponse{Valid: false, DiscountPercent: c.DiscountPercent, Reason: reasonPtr("coupons_not_allowed")}, c, nil
	}
	return CouponCheckResponse{Valid: true, DiscountPercent: c.DiscountPercent}, c, nil
}

// CheckCoupon is the read-only "is this coupon usable" check backing the
// public coupon-check endpoint (discards the underlying row).
func (a *App) CheckCoupon(ctx context.Context, code, courseID string) CouponCheckResponse {
	check, _, _ := a.ValidateAndFetchCoupon(ctx, code, courseID)
	return check
}

// Check is CheckCoupon with a short cache in front of it, backing the
// `/coupons/check` endpoint (a checkout-page-facing call that can fire on
// every keystroke of a coupon field).
func (a *App) Check(ctx context.Context, code, courseID string) CouponCheckResponse {
	cacheKey := fmt.Sprintf("coupons:check:c:%s:course:%s", url.QueryEscape(code), url.QueryEscape(courseID))
	var cached CouponCheckResponse
	if hit, _ := a.Cache.Get(ctx, cacheKey, &cached); hit {
		return cached
	}

	resp := a.CheckCoupon(ctx, code, courseID)
	_ = a.Cache.Set(ctx, cacheKey, resp, 30*time.Second)

	return resp
}
