package enrollments

import "fmt"

const (
	RevokeEnrollment = `UPDATE enrollments SET revoked = true WHERE user_id = NULLIF($1, '')::uuid AND course_id = NULLIF($2, '')::uuid;`

	RegainEnrollment = `UPDATE enrollments SET revoked = false WHERE user_id = NULLIF($1, '')::uuid AND course_id = NULLIF($2, '')::uuid;`
)

func BuildTutorListQuery(whereClause string, idx int) string {
	return fmt.Sprintf(`
		WITH auth AS (
			SELECT EXISTS(SELECT 1 FROM courses WHERE id = NULLIF($1, '')::uuid AND tutor_id = NULLIF($2, '')::uuid) AS is_owner
		)
		SELECT
			COALESCE((SELECT is_owner FROM auth), false) AS is_owner,
			COALESCE((
				SELECT COUNT(*) FROM enrollments e
				LEFT JOIN "users" u ON e.user_id = u.id
				CROSS JOIN auth a
				WHERE e.course_id = NULLIF($1, '')::uuid AND a.is_owner = true%s
			), 0) AS total,
			COALESCE((
				SELECT jsonb_agg(data_cte) FROM (
					SELECT
						e.id,
						jsonb_build_object('id', u.id, 'name', COALESCE(u.name, ''), 'image', COALESCE(u.image, '')) AS "user",
						jsonb_build_object('id', c.id, 'title', COALESCE(c.title, ''), 'thumbnail', c.image_url) AS "course",
						e.completion_percent,
						e.completed,
						e.revoked,
						e.enrolled_at
					FROM enrollments e
					LEFT JOIN "users" u ON e.user_id = u.id
					LEFT JOIN courses c ON c.id = e.course_id
					CROSS JOIN auth a
					WHERE e.course_id = NULLIF($1, '')::uuid AND a.is_owner = true%s
					ORDER BY e.enrolled_at DESC
					LIMIT $%d OFFSET $%d
				) data_cte
			), '[]'::jsonb) AS data
	`, whereClause, whereClause, idx, idx+1)
}

func BuildAdminListQuery(whereClause string) string {
	return fmt.Sprintf(`
		SELECT jsonb_build_object(
			'total', COALESCE((
				SELECT COUNT(*)
				FROM enrollments e
				LEFT JOIN courses c ON c.id = e.course_id
				LEFT JOIN "users" u ON e.user_id = u.id
				WHERE %s
			), 0),
			'data', COALESCE((
				SELECT jsonb_agg(
					jsonb_build_object(
						'id', e.id,
						'user', jsonb_build_object('id', u.id, 'name', COALESCE(u.name, ''), 'image', COALESCE(u.image, '')),
						'course', jsonb_build_object('id', c.id, 'title', COALESCE(c.title, ''), 'thumbnail', c.image_url),
						'completion_percent', e.completion_percent,
						'completed', e.completed,
						'revoked', e.revoked,
						'enrolled_at', e.enrolled_at
					) ORDER BY e.enrolled_at DESC
				)
				FROM (
					SELECT e.id, e.user_id, e.course_id, e.completion_percent, e.completed, e.revoked, e.enrolled_at
					FROM enrollments e
					LEFT JOIN courses c ON c.id = e.course_id
					LEFT JOIN "users" u ON e.user_id = u.id
					WHERE %s
					ORDER BY e.enrolled_at DESC
					LIMIT $1 OFFSET $2
				) e
				LEFT JOIN courses c ON c.id = e.course_id
				LEFT JOIN "users" u ON e.user_id = u.id
			), '[]'::jsonb)
		);
	`, whereClause, whereClause)
}
