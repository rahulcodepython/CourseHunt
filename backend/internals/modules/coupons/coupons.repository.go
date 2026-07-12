package coupons

import (
	"encoding/json"
	"errors"
)

// Explicit, granular domain errors
var (
	ErrCouponNotFound = errors.New("coupon not found")
	ErrUnauthorized   = errors.New("access denied: you are not the tutor of this course")
	ErrCourseNotFound = errors.New("associated course not found")
)

func (m *CouponsModule) ReadByCodeRepository(code string) (*Coupon, error) {
	// Dot-notation mapping handles nested CourseInfo structural assignments automatically
	var c Coupon
	query := `
		SELECT
			c.id, c.code, c.discount_percent, c.max_usage, c.usage_count,
			c.expires_at, c.is_active, c.created_by, c.created_at,
			c.course_id AS "course.id",
			COALESCE(co.title, '') AS "course.title",
			co.image_url AS "course.thumbnail"
		FROM coupons c
		LEFT JOIN courses co ON c.course_id = co.id
		WHERE c.code = $1`

	if err := m.DB.Get(&c, query, code); err != nil {
		return nil, ErrCouponNotFound
	}
	return &c, nil
}

func (m *CouponsModule) ListRepository(page, limit int, userID string) ([]Coupon, int, error) {
	offset := (page - 1) * limit

	// Single roundtrip returns overall database depth alongside pre-packed JSON payload arrays
	query := `
		WITH data_summary AS (
			SELECT
				c.id, c.code, c.discount_percent, c.max_usage, c.usage_count,
				c.expires_at, c.is_active, c.created_by, c.created_at,
				c.course_id,
				COALESCE(co.title, '') AS course_title,
				co.image_url AS course_thumbnail
			FROM coupons c
			LEFT JOIN courses co ON c.course_id = co.id
			WHERE co.tutor_id = $3
			ORDER BY c.created_at DESC
		)
		SELECT
			(SELECT COUNT(*) FROM data_summary) AS total_count,
			COALESCE(
				(
					SELECT json_agg(
						json_build_object(
							'id', ds.id,
							'code', ds.code,
							'discount_percent', ds.discount_percent,
							'max_usage', ds.max_usage,
							'usage_count', ds.usage_count,
							'expires_at', ds.expires_at,
							'is_active', ds.is_active,
							'created_by', ds.created_by,
							'created_at', ds.created_at,
							'course', json_build_object(
								'id', COALESCE(ds.course_id, ''),
								'title', ds.course_title,
								'thumbnail', ds.course_thumbnail
							)
						)
					)
					FROM (SELECT * FROM data_summary LIMIT $1 OFFSET $2) ds
				), '[]'::json
			) AS data_json`

	type couponListRow struct {
		TotalCount int    `db:"total_count"`
		DataJSON   []byte `db:"data_json"`
	}

	var row couponListRow

	if err := m.DB.Get(&row, query, limit, offset, userID); err != nil {
		return nil, 0, err
	}

	var coupons []Coupon
	if err := json.Unmarshal(row.DataJSON, &coupons); err != nil {
		return nil, 0, err
	}

	return coupons, row.TotalCount, nil
}

func (m *CouponsModule) CreateRepository(userID string, req CreateCouponRequest) (*Coupon, error) {
	// Status Code Tracking:
	// 0 = If coupon targets a course but it doesn't exist,
	// 1 = Course exists but requesting user is not the tutor,
	// 2 = Valid configuration (global coupon or owned course)
	query := `
		WITH auth_check AS (
			SELECT
				CASE
					WHEN $2::uuid IS NOT NULL AND NOT EXISTS(SELECT 1 FROM courses WHERE id = $2) THEN 0
					WHEN $2::uuid IS NOT NULL AND NOT EXISTS(SELECT 1 FROM courses WHERE id = $2 AND tutor_id = $1) THEN 1
					ELSE 2
				END as status_code
		),
		inserted AS (
			INSERT INTO coupons (code, course_id, discount_percent, max_usage, expires_at, is_active, created_by)
			SELECT $3, $2, $4, $5, $6, $7, $1
			FROM auth_check
			WHERE auth_check.status_code = 2
			RETURNING id, code, course_id, discount_percent, max_usage, usage_count, expires_at, is_active, created_by, created_at
		)
		SELECT
			ac.status_code AS status_flag,
			COALESCE(
				(
					SELECT json_build_object(
						'id', i.id,
						'code', i.code,
						'discount_percent', i.discount_percent,
						'max_usage', i.max_usage,
						'usage_count', i.usage_count,
						'expires_at', i.expires_at,
						'is_active', i.is_active,
						'created_by', i.created_by,
						'created_at', i.created_at,
						'course', json_build_object(
							'id', COALESCE(i.course_id, ''),
							'title', COALESCE(co.title, ''),
							'thumbnail', co.image_url
						)
					) FROM inserted i
					LEFT JOIN courses co ON i.course_id = co.id
				), '{}'::json
			) AS data_json
		FROM auth_check ac;`

	var res struct {
		StatusFlag int    `db:"status_flag"`
		DataJSON   []byte `db:"data_json"`
	}

	if err := m.DB.Get(&res, query, userID, req.CourseID, req.Code, req.DiscountPercent, req.MaxUsage, req.ExpiresAt, req.IsActive); err != nil {
		return nil, err
	}

	switch res.StatusFlag {
	case 0:
		return nil, ErrCourseNotFound
	case 1:
		return nil, ErrUnauthorized
	default:
		var c Coupon
		if err := json.Unmarshal(res.DataJSON, &c); err != nil {
			return nil, err
		}
		return &c, nil
	}
}

func (m *CouponsModule) UpdateRepository(id, userID string, req UpdateCouponRequest) (*Coupon, error) {
	// Status Code Tracking:
	// 0 = Coupon doesn't exist
	// 1 = Coupon exists, belongs to a course, but user is not the tutor (or created_by doesn't match for global ones)
	// 2 = Authorized match
	query := `
		WITH status_check AS (
			SELECT
				CASE
					WHEN NOT EXISTS(SELECT 1 FROM coupons WHERE id = :id) THEN 0
					WHEN EXISTS(
						SELECT 1 FROM coupons cp
						LEFT JOIN courses co ON cp.course_id = co.id
						WHERE cp.id = :id AND ((cp.course_id IS NOT NULL AND co.tutor_id != :user_id) OR (cp.course_id IS NULL AND cp.created_by != :user_id))
					) THEN 1
					ELSE 2
				END as status_code
		),
		updated AS (
			UPDATE coupons c
			SET
				discount_percent = COALESCE(:discount_percent, discount_percent),
				max_usage = COALESCE(:max_usage, max_usage),
				expires_at = COALESCE(:expires_at, expires_at),
				is_active = COALESCE(:is_active, is_active)
			WHERE c.id = :id AND EXISTS (SELECT 1 FROM status_check WHERE status_code = 2)
			RETURNING c.id, c.code, c.course_id, c.discount_percent, c.max_usage, c.usage_count, c.expires_at, c.is_active, c.created_by, c.created_at
		)
		SELECT
			sc.status_code AS status_flag,
			COALESCE(
				(
					SELECT json_build_object(
						'id', u.id,
						'code', u.code,
						'discount_percent', u.discount_percent,
						'max_usage', u.max_usage,
						'usage_count', u.usage_count,
						'expires_at', u.expires_at,
						'is_active', u.is_active,
						'created_by', u.created_by,
						'created_at', u.created_at,
						'course', json_build_object(
							'id', COALESCE(u.course_id, ''),
							'title', COALESCE(co.title, ''),
							'thumbnail', co.image_url
						)
					) FROM updated u
					LEFT JOIN courses co ON u.course_id = co.id
				), '{}'::json
			) AS data_json
		FROM status_check sc;`

	args := map[string]interface{}{
		"id":               id,
		"user_id":          userID,
		"discount_percent": req.DiscountPercent,
		"max_usage":        req.MaxUsage,
		"expires_at":       req.ExpiresAt,
		"is_active":        req.IsActive,
	}

	stmt, err := m.DB.PrepareNamed(query)
	if err != nil {
		return nil, err
	}
	defer stmt.Close()

	var res struct {
		StatusFlag int    `db:"status_flag"`
		DataJSON   []byte `db:"data_json"`
	}

	if err := stmt.Get(&res, args); err != nil {
		return nil, err
	}

	switch res.StatusFlag {
	case 0:
		return nil, ErrCouponNotFound
	case 1:
		return nil, ErrUnauthorized
	default:
		var c Coupon
		if err := json.Unmarshal(res.DataJSON, &c); err != nil {
			return nil, err
		}
		return &c, nil
	}
}

func (m *CouponsModule) DeleteRepository(id, userID string) (string, error) {
	// Combined verification and execution tracking multi-tenant ownership metrics
	query := `
		WITH status_check AS (
			SELECT
				CASE
					WHEN NOT EXISTS(SELECT 1 FROM coupons WHERE id = $1) THEN 0
					WHEN EXISTS(
						SELECT 1 FROM coupons cp
						LEFT JOIN courses co ON cp.course_id = co.id
						WHERE cp.id = $1 AND ((cp.course_id IS NOT NULL AND co.tutor_id != $2) OR (cp.course_id IS NULL AND cp.created_by != $2))
					) THEN 1
					ELSE 2
				END as status_code
		),
		deleted AS (
			DELETE FROM coupons c
			WHERE c.id = $1 AND EXISTS(SELECT 1 FROM status_check WHERE status_code = 2)
			RETURNING c.id
		)
		SELECT
			sc.status_code AS status_flag,
			COALESCE((SELECT d.id FROM deleted d), '') AS deleted_id
		FROM status_check sc;`

	var res struct {
		StatusFlag int    `db:"status_flag"`
		DeletedID  string `db:"deleted_id"`
	}

	if err := m.DB.Get(&res, query, id, userID); err != nil {
		return "", err
	}

	switch res.StatusFlag {
	case 0:
		return "", ErrCouponNotFound
	case 1:
		return "", ErrUnauthorized
	default:
		return res.DeletedID, nil
	}
}

func (m *CouponsModule) RecordUsageRepository(couponID, userID, courseID string) error {
	// Atomically handle logging unique tracking and modifying primary counters
	query := `
		WITH inserted AS (
			INSERT INTO coupon_usages (coupon_id, user_id, course_id)
			VALUES ($1, $2, $3)
			ON CONFLICT DO NOTHING
			RETURNING coupon_id
		)
		UPDATE coupons SET usage_count = usage_count + 1
		WHERE id = $1 AND EXISTS (SELECT 1 FROM inserted);`

	_, err := m.DB.Exec(query, couponID, userID, courseID)
	return err
}
