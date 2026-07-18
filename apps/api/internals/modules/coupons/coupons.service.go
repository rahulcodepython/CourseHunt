package coupons

import (
	"errors"
	"time"
)

func (m *CouponsModule) CheckCoupon(code, courseID string) CouponCheckResponse {
	c, err := m.ReadByCodeRepository(code)
	reason := func(s string) *string { return &s }

	if err != nil {
		if errors.Is(err, ErrCouponNotFound) {
			return CouponCheckResponse{Valid: false, Reason: reason("not_found")}
		}
		return CouponCheckResponse{Valid: false, Reason: reason("error")}
	}
	if !c.IsActive {
		return CouponCheckResponse{Valid: false, DiscountPercent: c.DiscountPercent, Reason: reason("inactive")}
	}
	if time.Now().After(c.ExpiresAt) {
		return CouponCheckResponse{Valid: false, DiscountPercent: c.DiscountPercent, Reason: reason("expired")}
	}
	if c.UsageCount >= c.MaxUsage {
		return CouponCheckResponse{Valid: false, DiscountPercent: c.DiscountPercent, Reason: reason("max_usage_reached")}
	}
	if c.Course.ID != "" && c.Course.ID != courseID {
		return CouponCheckResponse{Valid: false, DiscountPercent: c.DiscountPercent, Reason: reason("not_applicable")}
	}
	return CouponCheckResponse{Valid: true, DiscountPercent: c.DiscountPercent}
}
