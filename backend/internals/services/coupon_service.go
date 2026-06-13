package services

import (
	"errors"
	"time"

	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/repositories"
)

type CouponService struct {
	Coupons *repositories.CouponRepository
}

func NewCouponService() *CouponService {
	return &CouponService{Coupons: repositories.NewCouponRepository()}
}

func (s *CouponService) List() ([]models.Coupon, error) {
	return s.Coupons.List()
}

func (s *CouponService) Check(code string) (*models.Coupon, error) {
	coupon, err := s.Coupons.FindByCode(code)
	if err != nil {
		return nil, errors.New("Coupon not found")
	}
	if !coupon.IsActive {
		return nil, errors.New("Coupon is not active")
	}
	if coupon.Usage >= coupon.MaxUsage {
		return nil, errors.New("Coupon usage limit reached")
	}
	if time.Now().After(coupon.ExpiryDate) {
		return nil, errors.New("Coupon has expired")
	}
	return coupon, nil
}

func (s *CouponService) Create(coupon *models.Coupon) (*models.Coupon, error) {
	return s.Coupons.Create(coupon)
}

func (s *CouponService) Update(id int, coupon *models.Coupon) (*models.Coupon, error) {
	return s.Coupons.Update(id, coupon)
}

func (s *CouponService) Delete(id int) error {
	return s.Coupons.Delete(id)
}
