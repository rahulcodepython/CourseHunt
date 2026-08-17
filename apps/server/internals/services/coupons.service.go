package services

import (
	"time"

	"coursehunt/server/internals/entities"
	"coursehunt/server/internals/repositories"
)

type CouponsService struct {
	Repo *repositories.CouponsRepository
}

func NewCouponsService(repo *repositories.CouponsRepository) *CouponsService {
	return &CouponsService{Repo: repo}
}

func (s *CouponsService) CheckCoupon(code, courseID string) entities.CouponCheckResponse {
	check, _, _ := s.ValidateAndFetchCouponService(code, courseID)
	return check
}

func reasonPtr(s string) *string { return &s }

func (s *CouponsService) ValidateAndFetchCouponService(code, courseID string) (entities.CouponCheckResponse, *entities.Coupon, error) {
	c, err := s.Repo.ReadByCodeRepository(code)
	if err != nil {
		return entities.CouponCheckResponse{Valid: false, Reason: reasonPtr("not_found")}, nil, nil
	}
	if !c.IsActive {
		return entities.CouponCheckResponse{Valid: false, DiscountPercent: c.DiscountPercent, Reason: reasonPtr("inactive")}, c, nil
	}
	if time.Now().After(c.ExpiresAt) {
		return entities.CouponCheckResponse{Valid: false, DiscountPercent: c.DiscountPercent, Reason: reasonPtr("expired")}, c, nil
	}
	if c.UsageCount >= c.MaxUsage {
		return entities.CouponCheckResponse{Valid: false, DiscountPercent: c.DiscountPercent, Reason: reasonPtr("max_usage_reached")}, c, nil
	}
	if c.Course.ID != "" && c.Course.ID != courseID {
		return entities.CouponCheckResponse{Valid: false, DiscountPercent: c.DiscountPercent, Reason: reasonPtr("not_applicable")}, c, nil
	}
	// Free courses (and any course a tutor/admin has explicitly opted out of
	// coupons for) never accept a coupon, regardless of which coupon it is.
	if allowed, err := s.Repo.CourseAllowsCouponRepository(courseID); err != nil || !allowed {
		return entities.CouponCheckResponse{Valid: false, DiscountPercent: c.DiscountPercent, Reason: reasonPtr("coupons_not_allowed")}, c, nil
	}
	return entities.CouponCheckResponse{Valid: true, DiscountPercent: c.DiscountPercent}, c, nil
}
