package coupons

import (
	"database/sql"
	"time"
)

func (m *CouponsModule) ListService(page, limit int) ([]Coupon, int, error) {
	return m.ListRepository(page, limit)
}
func (m *CouponsModule) CreateService(createdBy string, req CreateCouponRequest) (*Coupon, error) {
	return m.CreateRepository(createdBy, req)
}
func (m *CouponsModule) UpdateService(id string, req UpdateCouponRequest) (*Coupon, error) {
	return m.UpdateRepository(id, req)
}
func (m *CouponsModule) DeleteService(id string) (string, error) {
	return m.DeleteRepository(id)
}
func (m *CouponsModule) CheckService(code, courseID string) CouponCheckResponse {
	c, err := m.ReadByCodeRepository(code)
	reason := func(s string) *string { return &s }

	if err == sql.ErrNoRows {
		r := "not_found"
		return CouponCheckResponse{Valid: false, Reason: &r}
	}
	if err != nil {
		r := "error"
		return CouponCheckResponse{Valid: false, Reason: &r}
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
