package coupons

import "fmt"

const (
	CourseAllowsCoupon = `SELECT coupon_allowed FROM courses WHERE id = $1;`

	ReadByCodeJSON = `
		SELECT jsonb_build_object(
			'id', c.id,
			'code', c.code,
			'discount_percent', c.discount_percent,
			'max_usage', c.max_usage,
			'usage_count', c.usage_count,
			'expires_at', c.expires_at,
			'is_active', c.is_active,
			'created_by', c.created_by,
			'created_at', c.created_at,
			'course', jsonb_build_object(
				'id', COALESCE(c.course_id::text, ''),
				'title', COALESCE(co.title, ''),
				'thumbnail', co.image_url
			)
		)
		FROM coupons c
		LEFT JOIN courses co ON c.course_id = co.id
		WHERE c.code = $1;
	`
)

func BuildListQuery(whereClause string) string {
	return fmt.Sprintf(`
		SELECT jsonb_build_object(
			'total', COALESCE((
				SELECT COUNT(*) FROM coupons c
				LEFT JOIN courses co ON c.course_id = co.id
				WHERE %s
			), 0),
			'data', COALESCE((
				SELECT jsonb_agg(
					jsonb_build_object(
						'id', ds.id,
						'code', ds.code,
						'discount_percent', ds.discount_percent,
						'max_usage', ds.max_usage,
						'usage_count', ds.usage_count,
						'expires_at', ds.expires_at,
						'is_active', ds.is_active,
						'created_by', ds.created_by,
						'created_at', ds.created_at,
						'course', jsonb_build_object(
							'id', COALESCE(ds.course_id::text, ''),
							'title', COALESCE(co.title, ''),
							'thumbnail', co.image_url
						)
					) ORDER BY ds.created_at DESC
				)
				FROM (
					SELECT * FROM coupons c
					WHERE %s
					ORDER BY c.created_at DESC
					LIMIT $1 OFFSET $2
				) ds
				LEFT JOIN courses co ON ds.course_id = co.id
			), '[]'::jsonb)
		);
	`, whereClause, whereClause)
}

const (
	AdminCreateCoupon = `
		WITH auth_check AS (
			SELECT
				CASE
					WHEN $2::uuid IS NOT NULL AND NOT EXISTS(SELECT 1 FROM courses WHERE id = $2) THEN 0
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
					SELECT jsonb_build_object(
						'id', i.id,
						'code', i.code,
						'discount_percent', i.discount_percent,
						'max_usage', i.max_usage,
						'usage_count', i.usage_count,
						'expires_at', i.expires_at,
						'is_active', i.is_active,
						'created_by', i.created_by,
						'created_at', i.created_at,
						'course', jsonb_build_object(
							'id', COALESCE(i.course_id::text, ''),
							'title', COALESCE(co.title, ''),
							'thumbnail', co.image_url
						)
					) FROM inserted i
					LEFT JOIN courses co ON i.course_id = co.id
				), '{}'::jsonb
			) AS data_json
		FROM auth_check ac;
	`

	TutorCreateCoupon = `
		WITH auth_check AS (
			SELECT
				CASE
					WHEN NOT EXISTS(SELECT 1 FROM courses WHERE id = $2) THEN 0
					WHEN NOT EXISTS(SELECT 1 FROM courses WHERE id = $2 AND tutor_id = $1) THEN 1
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
					SELECT jsonb_build_object(
						'id', i.id,
						'code', i.code,
						'discount_percent', i.discount_percent,
						'max_usage', i.max_usage,
						'usage_count', i.usage_count,
						'expires_at', i.expires_at,
						'is_active', i.is_active,
						'created_by', i.created_by,
						'created_at', i.created_at,
						'course', jsonb_build_object(
							'id', COALESCE(i.course_id::text, ''),
							'title', COALESCE(co.title, ''),
							'thumbnail', co.image_url
						)
					) FROM inserted i
					LEFT JOIN courses co ON i.course_id = co.id
				), '{}'::jsonb
			) AS data_json
		FROM auth_check ac;
	`

	AdminUpdateCoupon = `
		WITH status_check AS (
			SELECT
				CASE
					WHEN NOT EXISTS(SELECT 1 FROM coupons WHERE id = $1) THEN 0
					ELSE 2
				END as status_code
		),
		updated AS (
			UPDATE coupons c
			SET
				discount_percent = COALESCE($2, discount_percent),
				max_usage = COALESCE($3, max_usage),
				expires_at = COALESCE($4, expires_at),
				is_active = COALESCE($5, is_active)
			WHERE c.id = $1 AND EXISTS (SELECT 1 FROM status_check WHERE status_code = 2)
			RETURNING c.id, c.code, c.course_id, c.discount_percent, c.max_usage, c.usage_count, c.expires_at, c.is_active, c.created_by, c.created_at
		)
		SELECT
			sc.status_code AS status_flag,
			COALESCE(
				(
					SELECT jsonb_build_object(
						'id', u.id,
						'code', u.code,
						'discount_percent', u.discount_percent,
						'max_usage', u.max_usage,
						'usage_count', u.usage_count,
						'expires_at', u.expires_at,
						'is_active', u.is_active,
						'created_by', u.created_by,
						'created_at', u.created_at,
						'course', jsonb_build_object(
							'id', COALESCE(u.course_id::text, ''),
							'title', COALESCE(co.title, ''),
							'thumbnail', co.image_url
						)
					) FROM updated u
					LEFT JOIN courses co ON u.course_id = co.id
				), '{}'::jsonb
			) AS data_json
		FROM status_check sc;
	`

	TutorUpdateCoupon = `
		WITH status_check AS (
			SELECT
				CASE
					WHEN NOT EXISTS(SELECT 1 FROM coupons WHERE id = $1) THEN 0
					WHEN EXISTS(SELECT 1 FROM coupons WHERE id = $1 AND created_by != $2) THEN 1
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
					SELECT jsonb_build_object(
						'id', u.id,
						'code', u.code,
						'discount_percent', u.discount_percent,
						'max_usage', u.max_usage,
						'usage_count', u.usage_count,
						'expires_at', u.expires_at,
						'is_active', u.is_active,
						'created_by', u.created_by,
						'created_at', u.created_at,
						'course', jsonb_build_object(
							'id', COALESCE(u.course_id::text, ''),
							'title', COALESCE(co.title, ''),
							'thumbnail', co.image_url
						)
					) FROM updated u
					LEFT JOIN courses co ON u.course_id = co.id
				), '{}'::jsonb
			) AS data_json
		FROM status_check sc;
	`

	AdminDeleteCoupon = `
		WITH status_check AS (
			SELECT
				CASE
					WHEN NOT EXISTS(SELECT 1 FROM coupons WHERE id = $1) THEN 0
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
		FROM status_check sc;
	`

	TutorDeleteCoupon = `
		WITH status_check AS (
			SELECT
				CASE
					WHEN NOT EXISTS(SELECT 1 FROM coupons WHERE id = $1) THEN 0
					WHEN EXISTS(SELECT 1 FROM coupons WHERE id = $1 AND created_by != $2) THEN 1
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
		FROM status_check sc;
	`
)
