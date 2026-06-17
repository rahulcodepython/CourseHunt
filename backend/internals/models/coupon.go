package models

import "time"

type Coupon struct {
	ID              string     `json:"id"`
	Code            string     `json:"code"`
	CourseID        *string    `json:"course_id"`
	DiscountPercent float64    `json:"discount_percent"`
	MaxUsage        int        `json:"max_usage"`
	UsageCount      int        `json:"usage_count"`
	ExpiresAt       time.Time  `json:"expires_at"`
	IsActive        bool       `json:"is_active"`
	CreatedBy       *string    `json:"created_by"`
	CreatedAt       time.Time  `json:"created_at"`
}

type CouponUsage struct {
	ID       string    `json:"id"`
	CouponID string    `json:"coupon_id"`
	UserID   string    `json:"user_id"`
	CourseID string    `json:"course_id"`
	UsedAt   time.Time `json:"used_at"`
}
