package services

import (
	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/repositories"
)

type CouponService struct{ Repo *repositories.CouponRepository }

func NewCouponService() *CouponService { return &CouponService{Repo: repositories.NewCouponRepository()} }

func (s *CouponService) List(page, limit int) ([]models.Coupon, int, error) { return s.Repo.List(page, limit) }
func (s *CouponService) Create(createdBy string, req models.CreateCouponRequest) (*models.Coupon, error) { return s.Repo.Create(createdBy, req) }
func (s *CouponService) Update(id string, req models.UpdateCouponRequest) (*models.Coupon, error) { return s.Repo.Update(id, req) }
func (s *CouponService) Delete(id string) error { return s.Repo.Delete(id) }
func (s *CouponService) Check(code, courseID string) models.CouponCheckResponse { return s.Repo.Check(code, courseID) }
