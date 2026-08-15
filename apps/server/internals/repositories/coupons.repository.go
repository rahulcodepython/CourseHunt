package repositories

import (
	"coursehunt/server/internals/entities"
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/pkg/cache"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/jmoiron/sqlx"
)

type CouponsRepository struct {
	DB          *sqlx.DB
	CoursesRepo *CoursesRepository
	Cache       *cache.Cache
}

func NewCouponsRepository(db *sqlx.DB, coursesRepo *CoursesRepository, cache *cache.Cache) *CouponsRepository {
	return &CouponsRepository{DB: db, CoursesRepo: coursesRepo, Cache: cache}
}

// Explicit, granular domain errors

func (r *CouponsRepository) ReadByCodeRepository(code string) (*entities.Coupon, error) {
	// Dot-notation mapping handles nested CourseInfo structural assignments automatically
	var c entities.Coupon
	query := `
		SELECT
			c.id, c.code, c.discount_percent, c.max_usage, c.usage_count,
			c.expires_at, c.is_active, c.created_by, c.created_at,
			COALESCE(c.course_id::text, '') AS "course.id",
			COALESCE(co.title, '') AS "course.title",
			co.image_url AS "course.thumbnail"
		FROM coupons c
		LEFT JOIN courses co ON c.course_id = co.id
		WHERE c.code = $1`

	if err := r.DB.Get(&c, query, code); err != nil {
		return nil, generic.ErrCouponNotFound
	}
	return &c, nil
}

// ListRepository returns every coupon for admins, or only the caller's own
// created coupons for tutors.
func (r *CouponsRepository) ListRepository(page, limit int, userID string, scope generic.AuthScope, status, isActive, code string) ([]entities.Coupon, int, error) {
	offset := (page - 1) * limit

	var where []string
	args := []any{limit, offset}
	idx := 3

	if scope != generic.ScopeAdmin {
		where = append(where, fmt.Sprintf("c.created_by = $%d", idx))
		args = append(args, userID)
		idx++
	}

	if status != "" {
		where = append(where, fmt.Sprintf("c.is_active = $%d::boolean", idx))
		args = append(args, status)
		idx++
	}
	if isActive == "true" || isActive == "false" {
		where = append(where, fmt.Sprintf("c.is_active = $%d", idx))
		args = append(args, isActive == "true")
		idx++
	}
	if code != "" {
		where = append(where, fmt.Sprintf("c.code ILIKE $%d", idx))
		args = append(args, "%"+code+"%")
		idx++
	}

	whereClause := "1=1"
	if len(where) > 0 {
		whereClause = strings.Join(where, " AND ")
	}

	query := fmt.Sprintf(`
		WITH data_summary AS (
			SELECT
				c.id, c.code, c.discount_percent, c.max_usage, c.usage_count,
				c.expires_at, c.is_active, c.created_by, c.created_at,
				c.course_id,
				COALESCE(co.title, '') AS course_title,
				co.image_url AS course_thumbnail
			FROM coupons c
			LEFT JOIN courses co ON c.course_id = co.id
			WHERE %s
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
								'id', COALESCE(ds.course_id::text, ''),
								'title', ds.course_title,
								'thumbnail', ds.course_thumbnail
							)
						)
					)
					FROM (SELECT * FROM data_summary LIMIT $1 OFFSET $2) ds
				), '[]'::json
			) AS data_json`, whereClause)

	type couponListRow struct {
		TotalCount int    `db:"total_count"`
		DataJSON   []byte `db:"data_json"`
	}

	var row couponListRow

	if err := r.DB.Get(&row, query, args...); err != nil {
		return nil, 0, err
	}

	var coupons []entities.Coupon
	if err := json.Unmarshal(row.DataJSON, &coupons); err != nil {
		return nil, 0, err
	}

	return coupons, row.TotalCount, nil
}

// CreateRepository creates a coupon. Admins may target any course or leave it
// unset (a global coupon); tutors must target one of their own courses.
func (r *CouponsRepository) CreateRepository(userID string, scope generic.AuthScope, req entities.CreateCouponRequest) (*entities.Coupon, error) {
	// Status Code Tracking:
	// 0 = coupon targets a course but it doesn't exist
	// 1 = course exists but the requesting tutor doesn't own it
	// 2 = valid configuration (admin: any/no course; tutor: their own course)
	// 3 = tutor did not specify a course
	query := `
		WITH auth_check AS (
			SELECT
				CASE
					WHEN $2::uuid IS NOT NULL AND NOT EXISTS(SELECT 1 FROM courses WHERE id = $2) THEN 0
					WHEN $8 != 'admin' AND $2::uuid IS NULL THEN 3
					WHEN $8 != 'admin' AND $2::uuid IS NOT NULL AND NOT EXISTS(SELECT 1 FROM courses WHERE id = $2 AND tutor_id = $1) THEN 1
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
							'id', COALESCE(i.course_id::text, ''),
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

	if err := r.DB.Get(&res, query, userID, req.CourseID, req.Code, req.DiscountPercent, req.MaxUsage, req.ExpiresAt, req.IsActive, string(scope)); err != nil {
		return nil, err
	}

	switch res.StatusFlag {
	case 0:
		return nil, generic.ErrCouponsCourseNotFound
	case 1:
		return nil, generic.ErrCouponsUnauthorized
	case 3:
		return nil, generic.ErrCouponsCourseRequired
	default:
		var c entities.Coupon
		if err := json.Unmarshal(res.DataJSON, &c); err != nil {
			return nil, err
		}
		return &c, nil
	}
}

// UpdateRepository updates a coupon. Admins may update any coupon; tutors
// may only update coupons they personally created.
func (r *CouponsRepository) UpdateRepository(id, userID string, scope generic.AuthScope, req entities.UpdateCouponRequest) (*entities.Coupon, error) {
	// Status Code Tracking:
	// 0 = coupon doesn't exist
	// 1 = not the coupon's creator (and not an admin)
	// 2 = authorized
	query := `
		WITH status_check AS (
			SELECT
				CASE
					WHEN NOT EXISTS(SELECT 1 FROM coupons WHERE id = $1) THEN 0
					WHEN $7 != 'admin' AND EXISTS(SELECT 1 FROM coupons WHERE id = $1 AND created_by != $2) THEN 1
					ELSE 2
				END as status_code
		),
		updated AS (
			UPDATE coupons c
			SET
				discount_percent = COALESCE($3, discount_percent),
				max_usage = COALESCE($4, max_usage),
				expires_at = COALESCE($5, expires_at),
				is_active = COALESCE($6, is_active)
			WHERE c.id = $1 AND EXISTS (SELECT 1 FROM status_check WHERE status_code = 2)
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
							'id', COALESCE(u.course_id::text, ''),
							'title', COALESCE(co.title, ''),
							'thumbnail', co.image_url
						)
					) FROM updated u
					LEFT JOIN courses co ON u.course_id = co.id
				), '{}'::json
			) AS data_json
		FROM status_check sc;`

	var res struct {
		StatusFlag int    `db:"status_flag"`
		DataJSON   []byte `db:"data_json"`
	}

	if err := r.DB.Get(&res, query, id, userID, req.DiscountPercent, req.MaxUsage, req.ExpiresAt, req.IsActive, string(scope)); err != nil {
		return nil, err
	}

	switch res.StatusFlag {
	case 0:
		return nil, generic.ErrCouponNotFound
	case 1:
		return nil, generic.ErrCouponsUnauthorized
	default:
		var c entities.Coupon
		if err := json.Unmarshal(res.DataJSON, &c); err != nil {
			return nil, err
		}
		return &c, nil
	}
}

// DeleteRepository deletes a coupon. Admins may delete any coupon; tutors
// may only delete coupons they personally created.
func (r *CouponsRepository) DeleteRepository(id, userID string, scope generic.AuthScope) (string, error) {
	query := `
		WITH status_check AS (
			SELECT
				CASE
					WHEN NOT EXISTS(SELECT 1 FROM coupons WHERE id = $1) THEN 0
					WHEN $3 != 'admin' AND EXISTS(SELECT 1 FROM coupons WHERE id = $1 AND created_by != $2) THEN 1
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
			COALESCE((SELECT d.id::text FROM deleted d), '') AS deleted_id
		FROM status_check sc;`

	var res struct {
		StatusFlag int    `db:"status_flag"`
		DeletedID  string `db:"deleted_id"`
	}

	if err := r.DB.Get(&res, query, id, userID, string(scope)); err != nil {
		return "", err
	}

	switch res.StatusFlag {
	case 0:
		return "", generic.ErrCouponNotFound
	case 1:
		return "", generic.ErrCouponsUnauthorized
	default:
		return res.DeletedID, nil
	}
}
