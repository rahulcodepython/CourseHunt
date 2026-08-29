package feedbacks

import "fmt"

const (
	CreateFeedback = `
		WITH course_auth AS (
			SELECT EXISTS(
				SELECT 1 FROM enrollments WHERE user_id = $2 AND course_id = $1 AND revoked = false
			) AS is_enrolled
		),
		inserted AS (
			INSERT INTO feedbacks (course_id, user_id, rating, content)
			SELECT $1, $2, $3, $4
			FROM course_auth
			WHERE is_enrolled = true
			ON CONFLICT (course_id, user_id) DO UPDATE SET rating = $3, content = $4
			RETURNING *
		),
		formatted AS (
			SELECT i.id, i.rating, i.content, i.is_pinned, i.created_at,
				   jsonb_build_object('id', c.id, 'title', COALESCE(c.title, ''), 'thumbnail', c.image_url) AS course,
				   jsonb_build_object('id', u.id, 'name', COALESCE(u.name, ''), 'image', u.image) AS "user"
			FROM inserted i
			JOIN "users" u ON u.id = i.user_id
			LEFT JOIN courses c ON c.id = i.course_id
		),
		notified AS (
			INSERT INTO notifications (type, message, is_admin, is_tutor, is_student)
			SELECT 'feedback', COALESCE(u.name, u.email) || ' left feedback on ' || COALESCE(c.title, 'a course'), true, true, false
			FROM inserted i
			JOIN "users" u ON u.id = i.user_id
			LEFT JOIN courses c ON c.id = i.course_id
		)
		SELECT
			(SELECT is_enrolled FROM course_auth) AS is_enrolled,
			(SELECT row_to_json(formatted.*) FROM formatted) AS inserted_data;
	`

	UpdateFeedbackPin = `
		WITH updated AS (
			UPDATE feedbacks SET is_pinned = $1 WHERE id = $2 RETURNING *
		)
		SELECT row_to_json(formatted.*)
		FROM (
			SELECT u.id, u.rating, u.content, u.is_pinned, u.created_at,
				   jsonb_build_object('id', c.id, 'title', COALESCE(c.title, ''), 'thumbnail', c.image_url) AS course,
				   jsonb_build_object('id', usr.id, 'name', COALESCE(usr.name, ''), 'image', usr.image) AS "user"
			FROM updated u
			JOIN "users" usr ON usr.id = u.user_id
			LEFT JOIN courses c ON c.id = u.course_id
		) formatted;
	`

	DeleteFeedback = `
		WITH feedback_course AS (
			SELECT c.tutor_id
			FROM feedbacks f
			JOIN courses c ON c.id = f.course_id
			WHERE f.id = $1
		),
		deleted AS (
			DELETE FROM feedbacks f
			USING feedback_course fc
			WHERE f.id = $1 AND (fc.tutor_id = $2 OR $3 = 'admin')
			RETURNING f.id
		)
		SELECT
			EXISTS(SELECT 1 FROM feedback_course) AS course_found,
			EXISTS(SELECT 1 FROM feedback_course WHERE tutor_id = $2) AS is_owner,
			COALESCE((SELECT id::text FROM deleted), '') AS deleted_id;
	`
)

func BuildListQuery(whereClause string, idx int) string {
	return fmt.Sprintf(`
		SELECT jsonb_build_object(
			'total', COALESCE((
				SELECT COUNT(*)
				FROM feedbacks f
				JOIN "users" u ON u.id = f.user_id
				LEFT JOIN courses c ON c.id = f.course_id
				%s
			), 0),
			'data', COALESCE((
				SELECT jsonb_agg(
					jsonb_build_object(
						'id', f.id,
						'rating', f.rating,
						'content', f.content,
						'is_pinned', f.is_pinned,
						'created_at', f.created_at,
						'course', jsonb_build_object('id', c.id, 'title', COALESCE(c.title, ''), 'thumbnail', c.image_url),
						'user', jsonb_build_object('id', u.id, 'name', COALESCE(u.name, ''), 'image', u.image)
					) ORDER BY f.is_pinned DESC, f.created_at DESC
				)
				FROM (
					SELECT f.id, f.rating, f.content, f.is_pinned, f.created_at, f.course_id, f.user_id
					FROM feedbacks f
					JOIN "users" u ON u.id = f.user_id
					LEFT JOIN courses c ON c.id = f.course_id
					%s
					ORDER BY f.is_pinned DESC, f.created_at DESC
					LIMIT $%d OFFSET $%d
				) f
				JOIN "users" u ON u.id = f.user_id
				LEFT JOIN courses c ON c.id = f.course_id
			), '[]'::jsonb)
		);
	`, whereClause, whereClause, idx, idx+1)
}
