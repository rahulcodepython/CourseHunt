package coupons

import (
	"coursehunt/api/internals/models"
	"time"
)

type Coupon struct {
	ID              string            `json:"id" db:"id"`
	Code            string            `json:"code" db:"code"`
	Course          models.CourseInfo `json:"course" db:""`
	DiscountPercent float64           `json:"discount_percent" db:"discount_percent"`
	MaxUsage        int               `json:"max_usage" db:"max_usage"`
	UsageCount      int               `json:"usage_count" db:"usage_count"`
	ExpiresAt       time.Time         `json:"expires_at" db:"expires_at"`
	IsActive        bool              `json:"is_active" db:"is_active"`
	CreatedBy       *string           `json:"created_by" db:"created_by"`
	CreatedAt       time.Time         `json:"created_at" db:"created_at"`
}

// ── Coupons Requests & Responses ──

type CreateCouponRequest struct {
	Code            string    `json:"code" validate:"required,min=3,max=50"`
	CourseID        *string   `json:"course_id" validate:"omitempty,uuid"`
	DiscountPercent float64   `json:"discount_percent" validate:"required,min=1,max=100"`
	MaxUsage        int       `json:"max_usage" validate:"required,min=1"`
	ExpiresAt       time.Time `json:"expires_at" validate:"required"`
	IsActive        bool      `json:"is_active"`
}

type UpdateCouponRequest struct {
	DiscountPercent *float64   `json:"discount_percent" validate:"omitempty,min=1,max=100"`
	MaxUsage        *int       `json:"max_usage" validate:"omitempty,min=1"`
	ExpiresAt       *time.Time `json:"expires_at"`
	IsActive        *bool      `json:"is_active"`
}

type CouponCheckResponse struct {
	Valid           bool    `json:"valid"`
	DiscountPercent float64 `json:"discount_percent"`
	Reason          *string `json:"reason,omitempty"`
}
