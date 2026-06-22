package coupons

import (
	"database/sql"
	"fmt"
	"time"
)

func (m *CouponsModule) ReadByCodeRepository(code string) (*Coupon, error) {
	var c Coupon
	err := m.DB.QueryRow(`
		SELECT id, code, course_id, discount_percent, max_usage, usage_count, expires_at, is_active, created_by, created_at
		FROM coupons WHERE code = $1`, code).
		Scan(&c.ID, &c.Code, &c.CourseID, &c.DiscountPercent, &c.MaxUsage, &c.UsageCount, &c.ExpiresAt, &c.IsActive, &c.CreatedBy, &c.CreatedAt)
	return &c, err
}

func (m *CouponsModule) ReadRepository(id string) (*Coupon, error) {
	var c Coupon
	err := m.DB.QueryRow(`
		SELECT id, code, course_id, discount_percent, max_usage, usage_count, expires_at, is_active, created_by, created_at
		FROM coupons WHERE id = $1`, id).
		Scan(&c.ID, &c.Code, &c.CourseID, &c.DiscountPercent, &c.MaxUsage, &c.UsageCount, &c.ExpiresAt, &c.IsActive, &c.CreatedBy, &c.CreatedAt)
	return &c, err
}

func (m *CouponsModule) ListRepository(page, limit int) ([]Coupon, int, error) {
	var total int
	m.DB.QueryRow(`SELECT COUNT(*) FROM coupons`).Scan(&total)
	offset := (page - 1) * limit
	rows, err := m.DB.Query(`
		SELECT id, code, course_id, discount_percent, max_usage, usage_count, expires_at, is_active, created_by, created_at
		FROM coupons ORDER BY created_at DESC LIMIT $1 OFFSET $2`, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	var coupons []Coupon
	for rows.Next() {
		var c Coupon
		rows.Scan(&c.ID, &c.Code, &c.CourseID, &c.DiscountPercent, &c.MaxUsage, &c.UsageCount, &c.ExpiresAt, &c.IsActive, &c.CreatedBy, &c.CreatedAt)
		coupons = append(coupons, c)
	}
	if coupons == nil {
		coupons = []Coupon{}
	}
	return coupons, total, rows.Err()
}

func (m *CouponsModule) CreateRepository(createdBy string, req CreateCouponRequest) (*Coupon, error) {
	expiresAt, err := time.Parse(time.RFC3339, req.ExpiresAt)
	if err != nil {
		expiresAt, err = time.Parse("2006-01-02", req.ExpiresAt)
		if err != nil {
			return nil, fmt.Errorf("invalid expires_at format")
		}
	}
	var c Coupon
	err = m.DB.QueryRow(`
		INSERT INTO coupons (code, course_id, discount_percent, max_usage, expires_at, is_active, created_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, code, course_id, discount_percent, max_usage, usage_count, expires_at, is_active, created_by, created_at`,
		req.Code, req.CourseID, req.DiscountPercent, req.MaxUsage, expiresAt, req.IsActive, createdBy,
	).Scan(&c.ID, &c.Code, &c.CourseID, &c.DiscountPercent, &c.MaxUsage, &c.UsageCount, &c.ExpiresAt, &c.IsActive, &c.CreatedBy, &c.CreatedAt)
	return &c, err
}

func (m *CouponsModule) UpdateRepository(id string, req UpdateCouponRequest) (*Coupon, error) {
	if req.DiscountPercent != nil {
		m.DB.Exec(`UPDATE coupons SET discount_percent = $1 WHERE id = $2`, *req.DiscountPercent, id)
	}
	if req.MaxUsage != nil {
		m.DB.Exec(`UPDATE coupons SET max_usage = $1 WHERE id = $2`, *req.MaxUsage, id)
	}
	if req.IsActive != nil {
		m.DB.Exec(`UPDATE coupons SET is_active = $1 WHERE id = $2`, *req.IsActive, id)
	}
	if req.ExpiresAt != nil {
		expiresAt, _ := time.Parse(time.RFC3339, *req.ExpiresAt)
		m.DB.Exec(`UPDATE coupons SET expires_at = $1 WHERE id = $2`, expiresAt, id)
	}
	return m.ReadRepository(id)
}

func (m *CouponsModule) DeleteRepository(id string) error {
	_, err := m.DB.Exec(`DELETE FROM coupons WHERE id = $1`, id)
	return err
}

func (m *CouponsModule) RecordUsageRepository(couponID, userID, courseID string) error {
	tx, err := m.DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()
	if _, err := tx.Exec(`INSERT INTO coupon_usages (coupon_id, user_id, course_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`, couponID, userID, courseID); err != nil {
		return err
	}
	if _, err := tx.Exec(`UPDATE coupons SET usage_count = usage_count + 1 WHERE id = $1`, couponID); err != nil {
		return err
	}
	return tx.Commit()
}

func (m *CouponsModule) CheckRepository(code, courseID string) CouponCheckResponse {
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
	if c.CourseID != nil && *c.CourseID != courseID {
		return CouponCheckResponse{Valid: false, DiscountPercent: c.DiscountPercent, Reason: reason("not_applicable")}
	}
	return CouponCheckResponse{Valid: true, DiscountPercent: c.DiscountPercent}
}
