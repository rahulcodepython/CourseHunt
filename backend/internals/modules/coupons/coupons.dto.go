package coupons

// ── Coupons ──

type CreateCouponRequest struct {
	Code            string  `json:"code" validate:"required,min=3,max=50"`
	CourseID        *string `json:"course_id" validate:"omitempty,uuid"`
	DiscountPercent float64 `json:"discount_percent" validate:"required,min=1,max=100"`
	MaxUsage        int     `json:"max_usage" validate:"required,min=1"`
	ExpiresAt       string  `json:"expires_at" validate:"required"`
	IsActive        bool    `json:"is_active"`
}

type UpdateCouponRequest struct {
	DiscountPercent *float64 `json:"discount_percent" validate:"omitempty,min=1,max=100"`
	MaxUsage        *int     `json:"max_usage" validate:"omitempty,min=1"`
	ExpiresAt       *string  `json:"expires_at"`
	IsActive        *bool    `json:"is_active"`
}

// ── Coupon Check Response ──

type CouponCheckResponse struct {
	Valid           bool    `json:"valid"`
	DiscountPercent float64 `json:"discount_percent"`
	Reason          *string `json:"reason"`
}
