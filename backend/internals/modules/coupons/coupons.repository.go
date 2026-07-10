package coupons

import (
	"fmt"
	"strings"
	"time"
)

func (m *CouponsModule) ReadByCodeRepository(code string) (*Coupon, error) {
	var c Coupon
	var courseID, courseTitle, courseThumbnail *string

	err := m.DB.QueryRow(`
		SELECT 
			c.id, c.code, c.discount_percent, c.max_usage, c.usage_count, 
			c.expires_at, c.is_active, c.created_by, c.created_at,
			c.course_id, co.title, co.image_url
		FROM coupons c
		LEFT JOIN courses co ON c.course_id = co.id
		WHERE c.code = $1`, code).
		Scan(
			&c.ID, &c.Code, &c.DiscountPercent, &c.MaxUsage, &c.UsageCount,
			&c.ExpiresAt, &c.IsActive, &c.CreatedBy, &c.CreatedAt,
			&courseID, &courseTitle, &courseThumbnail,
		)

	if err == nil && courseID != nil {
		c.Course.ID = *courseID
		if courseTitle != nil {
			c.Course.Title = *courseTitle
		}
		c.Course.Thumbnail = courseThumbnail
	}
	return &c, err
}

func (m *CouponsModule) ListRepository(page, limit int) ([]Coupon, int, error) {
	var total int
	m.DB.QueryRow(`SELECT COUNT(*) FROM coupons`).Scan(&total)
	offset := (page - 1) * limit
	rows, err := m.DB.Query(`
		SELECT 
			c.id, c.code, c.discount_percent, c.max_usage, c.usage_count, 
			c.expires_at, c.is_active, c.created_by, c.created_at,
			c.course_id, co.title, co.image_url
		FROM coupons c
		LEFT JOIN courses co ON c.course_id = co.id
		ORDER BY c.created_at DESC LIMIT $1 OFFSET $2`, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	var coupons []Coupon
	for rows.Next() {
		var c Coupon
		var courseID, courseTitle, courseThumbnail *string
		err := rows.Scan(
			&c.ID, &c.Code, &c.DiscountPercent, &c.MaxUsage, &c.UsageCount,
			&c.ExpiresAt, &c.IsActive, &c.CreatedBy, &c.CreatedAt,
			&courseID, &courseTitle, &courseThumbnail,
		)
		if err != nil {
			return nil, 0, err
		}
		if courseID != nil {
			c.Course.ID = *courseID
			if courseTitle != nil {
				c.Course.Title = *courseTitle
			}
			c.Course.Thumbnail = courseThumbnail
		}
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
	var courseID, courseTitle, courseThumbnail *string

	err = m.DB.QueryRow(`
		WITH inserted AS (
			INSERT INTO coupons (code, course_id, discount_percent, max_usage, expires_at, is_active, created_by)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
			RETURNING id, code, course_id, discount_percent, max_usage, usage_count, expires_at, is_active, created_by, created_at
		)
		SELECT 
			i.id, i.code, i.discount_percent, i.max_usage, i.usage_count, 
			i.expires_at, i.is_active, i.created_by, i.created_at,
			i.course_id, co.title, co.image_url
		FROM inserted i
		LEFT JOIN courses co ON i.course_id = co.id`,
		req.Code, req.CourseID, req.DiscountPercent, req.MaxUsage, expiresAt, req.IsActive, createdBy,
	).Scan(
		&c.ID, &c.Code, &c.DiscountPercent, &c.MaxUsage, &c.UsageCount,
		&c.ExpiresAt, &c.IsActive, &c.CreatedBy, &c.CreatedAt,
		&courseID, &courseTitle, &courseThumbnail,
	)

	if err == nil && courseID != nil {
		c.Course.ID = *courseID
		if courseTitle != nil {
			c.Course.Title = *courseTitle
		}
		c.Course.Thumbnail = courseThumbnail
	}
	return &c, err
}

func (m *CouponsModule) UpdateRepository(id string, req UpdateCouponRequest) (*Coupon, error) {
	setClauses := []string{}
	var args []interface{}
	argIdx := 1

	if req.DiscountPercent != nil {
		setClauses = append(setClauses, fmt.Sprintf("discount_percent = $%d", argIdx))
		args = append(args, *req.DiscountPercent)
		argIdx++
	}
	if req.MaxUsage != nil {
		setClauses = append(setClauses, fmt.Sprintf("max_usage = $%d", argIdx))
		args = append(args, *req.MaxUsage)
		argIdx++
	}
	if req.IsActive != nil {
		setClauses = append(setClauses, fmt.Sprintf("is_active = $%d", argIdx))
		args = append(args, *req.IsActive)
		argIdx++
	}
	if req.ExpiresAt != nil {
		expiresAt, _ := time.Parse(time.RFC3339, *req.ExpiresAt)
		setClauses = append(setClauses, fmt.Sprintf("expires_at = $%d", argIdx))
		args = append(args, expiresAt)
		argIdx++
	}

	args = append(args, id)
	query := fmt.Sprintf(`
		WITH updated AS (
			UPDATE coupons SET %s WHERE id = $%d
			RETURNING id, code, course_id, discount_percent, max_usage, usage_count, expires_at, is_active, created_by, created_at
		)
		SELECT 
			u.id, u.code, u.discount_percent, u.max_usage, u.usage_count, 
			u.expires_at, u.is_active, u.created_by, u.created_at,
			u.course_id, co.title, co.image_url
		FROM updated u
		LEFT JOIN courses co ON u.course_id = co.id`, strings.Join(setClauses, ", "), argIdx)

	var c Coupon
	var courseID, courseTitle, courseThumbnail *string

	err := m.DB.QueryRow(query, args...).Scan(
		&c.ID, &c.Code, &c.DiscountPercent, &c.MaxUsage, &c.UsageCount,
		&c.ExpiresAt, &c.IsActive, &c.CreatedBy, &c.CreatedAt,
		&courseID, &courseTitle, &courseThumbnail,
	)

	if err == nil && courseID != nil {
		c.Course.ID = *courseID
		if courseTitle != nil {
			c.Course.Title = *courseTitle
		}
		c.Course.Thumbnail = courseThumbnail
	}
	return &c, err
}

func (m *CouponsModule) DeleteRepository(id string) (string, error) {
	var deletedID string
	err := m.DB.QueryRow(`DELETE FROM coupons WHERE id = $1 RETURNING id`, id).Scan(&deletedID)
	return deletedID, err
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
