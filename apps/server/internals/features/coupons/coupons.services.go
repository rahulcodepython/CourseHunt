package coupons

import (
	"context"
	"errors"
	"fmt"
	"net/url"
	"time"

	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/pkg/cache"
	"coursehunt/server/internals/utils"
)

type couponListCacheData struct {
	Data  []Coupon `json:"data"`
	Total int      `json:"total"`
}

// --- Admin Services ---

func (a *App) AdminList(ctx context.Context, page, limit int, status, isActive, code string) ([]Coupon, int, error) {
	cacheKey := fmt.Sprintf("coupons:admin:list:p:%d:l:%d:st:%s:ia:%s:c:%s", page, limit, status, isActive, code)

	result, err := cache.Fetch(ctx, a.Cache, cacheKey, 5*time.Minute, func() (couponListCacheData, error) {
		list, total, err := a.AdminListRepository(ctx, page, limit, status, isActive, code)
		if err != nil {
			return couponListCacheData{}, utils.ErrInternal("Failed to fetch coupons.", err)
		}
		return couponListCacheData{Data: list, Total: total}, nil
	})
	if err != nil {
		return nil, 0, err
	}
	return result.Data, result.Total, nil
}

func (a *App) AdminCreate(ctx context.Context, userID string, req CreateCouponRequest) (*Coupon, error) {
	coupon, err := a.AdminCreateRepository(ctx, userID, req)
	if err != nil {
		if errors.Is(err, generic.ErrCouponsCourseNotFound) {
			return nil, utils.ErrNotFound("Course not found.", err)
		}
		return nil, utils.ErrInternal("Failed to create coupon.", err)
	}

	a.Cache.Invalidate(ctx, "coupons:*")
	return coupon, nil
}

func (a *App) AdminUpdate(ctx context.Context, id string, req UpdateCouponRequest) (*Coupon, error) {
	coupon, err := a.AdminUpdateRepository(ctx, id, req)
	if err != nil {
		if errors.Is(err, generic.ErrCouponNotFound) {
			return nil, utils.ErrNotFound("Coupon not found.", err)
		}
		return nil, utils.ErrInternal("Failed to update coupon.", err)
	}

	a.Cache.Invalidate(ctx, "coupons:*")
	return coupon, nil
}

func (a *App) AdminDelete(ctx context.Context, id string) (string, error) {
	deletedID, err := a.AdminDeleteRepository(ctx, id)
	if err != nil {
		if errors.Is(err, generic.ErrCouponNotFound) {
			return "", utils.ErrNotFound("Coupon not found.", err)
		}
		return "", utils.ErrInternal("Failed to delete coupon.", err)
	}

	a.Cache.Invalidate(ctx, "coupons:*")
	return deletedID, nil
}

// --- Tutor Services ---

func (a *App) TutorList(ctx context.Context, page, limit int, userID, status, isActive, code string) ([]Coupon, int, error) {
	cacheKey := fmt.Sprintf("coupons:tutor:list:p:%d:l:%d:u:%s:st:%s:ia:%s:c:%s", page, limit, userID, status, isActive, code)

	result, err := cache.Fetch(ctx, a.Cache, cacheKey, 5*time.Minute, func() (couponListCacheData, error) {
		list, total, err := a.TutorListRepository(ctx, page, limit, userID, status, isActive, code)
		if err != nil {
			return couponListCacheData{}, utils.ErrInternal("Failed to fetch coupons.", err)
		}
		return couponListCacheData{Data: list, Total: total}, nil
	})
	if err != nil {
		return nil, 0, err
	}
	return result.Data, result.Total, nil
}

func (a *App) TutorCreate(ctx context.Context, userID string, req CreateCouponRequest) (*Coupon, error) {
	if req.CourseID == nil || *req.CourseID == "" {
		return nil, utils.ErrBadRequest("Course is required for tutor-created coupons.", generic.ErrCouponsCourseRequired)
	}

	coupon, err := a.TutorCreateRepository(ctx, userID, req)
	if err != nil {
		if errors.Is(err, generic.ErrCouponsCourseNotFound) {
			return nil, utils.ErrNotFound("Course not found.", err)
		}
		if errors.Is(err, generic.ErrCouponsUnauthorized) {
			return nil, utils.ErrForbidden("Access denied. You do not own this course.", err)
		}
		return nil, utils.ErrInternal("Failed to create coupon.", err)
	}

	a.Cache.Invalidate(ctx, "coupons:*")
	return coupon, nil
}

func (a *App) TutorUpdate(ctx context.Context, id, userID string, req UpdateCouponRequest) (*Coupon, error) {
	coupon, err := a.TutorUpdateRepository(ctx, id, userID, req)
	if err != nil {
		if errors.Is(err, generic.ErrCouponNotFound) {
			return nil, utils.ErrNotFound("Coupon not found.", err)
		}
		if errors.Is(err, generic.ErrCouponsUnauthorized) {
			return nil, utils.ErrForbidden("Access denied. You do not own this coupon.", err)
		}
		return nil, utils.ErrInternal("Failed to update coupon.", err)
	}

	a.Cache.Invalidate(ctx, "coupons:*")
	return coupon, nil
}

func (a *App) TutorDelete(ctx context.Context, id, userID string) (string, error) {
	deletedID, err := a.TutorDeleteRepository(ctx, id, userID)
	if err != nil {
		if errors.Is(err, generic.ErrCouponNotFound) {
			return "", utils.ErrNotFound("Coupon not found.", err)
		}
		if errors.Is(err, generic.ErrCouponsUnauthorized) {
			return "", utils.ErrForbidden("Access denied. You do not own this coupon.", err)
		}
		return "", utils.ErrInternal("Failed to delete coupon.", err)
	}

	a.Cache.Invalidate(ctx, "coupons:*")
	return deletedID, nil
}

// --- Validation & Public Checkout Methods ---

func reasonPtr(s string) *string { return &s }

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
	if allowed, err := a.CourseAllowsCouponRepository(ctx, courseID); err != nil || !allowed {
		return CouponCheckResponse{Valid: false, DiscountPercent: c.DiscountPercent, Reason: reasonPtr("coupons_not_allowed")}, c, nil
	}
	return CouponCheckResponse{Valid: true, DiscountPercent: c.DiscountPercent}, c, nil
}

func (a *App) CheckCoupon(ctx context.Context, code, courseID string) CouponCheckResponse {
	check, _, _ := a.ValidateAndFetchCoupon(ctx, code, courseID)
	return check
}

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
