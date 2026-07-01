package coupons

import (
	"coursehunt-backend/internals/models"
	"time"
)

type Coupon struct {
	ID              string            `json:"id"`
	Code            string            `json:"code"`
	Course          models.CourseInfo `json:"course"`
	DiscountPercent float64           `json:"discount_percent"`
	MaxUsage        int               `json:"max_usage"`
	UsageCount      int               `json:"usage_count"`
	ExpiresAt       time.Time         `json:"expires_at"`
	IsActive        bool              `json:"is_active"`
	CreatedBy       *string           `json:"created_by"`
	CreatedAt       time.Time         `json:"created_at"`
}
