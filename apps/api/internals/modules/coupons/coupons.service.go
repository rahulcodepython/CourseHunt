package coupons

import (
	"errors"
	"time"
)

func (m *CouponsModule) CheckCoupon(code, courseID string) CouponCheckResponse {
	check, _, _ := m.ValidateAndFetchCouponService(code, courseID)
	return check
}

func (m *CouponsModule) ValidateAndFetchCouponService(code, courseID string) (CouponCheckResponse, *Coupon, error) {
	c, err := m.ReadByCodeRepository(code)
	reason := func(s string) *string { return &s }

	if err != nil {
		if errors.Is(err, ErrCouponNotFound) {
			return CouponCheckResponse{Valid: false, Reason: reason("not_found")}, nil, nil
		}
		return CouponCheckResponse{Valid: false, Reason: reason("error")}, nil, nil
	}
	if !c.IsActive {
		return CouponCheckResponse{Valid: false, DiscountPercent: c.DiscountPercent, Reason: reason("inactive")}, c, nil
	}
	if time.Now().After(c.ExpiresAt) {
		return CouponCheckResponse{Valid: false, DiscountPercent: c.DiscountPercent, Reason: reason("expired")}, c, nil
	}
	if c.UsageCount >= c.MaxUsage {
		return CouponCheckResponse{Valid: false, DiscountPercent: c.DiscountPercent, Reason: reason("max_usage_reached")}, c, nil
	}
	if c.Course.ID != "" && c.Course.ID != courseID {
		return CouponCheckResponse{Valid: false, DiscountPercent: c.DiscountPercent, Reason: reason("not_applicable")}, c, nil
	}
	return CouponCheckResponse{Valid: true, DiscountPercent: c.DiscountPercent}, c, nil
}
