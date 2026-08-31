package updates

import "fmt"

const (
	CreateUpdate = `
		WITH inserted AS (
			INSERT INTO updates (course_id, created_by, message)
			SELECT $1::uuid, $2::uuid, $3
			WHERE $4::text = 'admin'
			   OR $1::uuid IS NULL
			   OR $1::uuid IN (SELECT id FROM courses WHERE tutor_id = $2::uuid)
			RETURNING id, course_id, created_by, message, created_at
		)
		SELECT jsonb_build_object(
			'id', i.id,
			'created_by', i.created_by,
			'message', i.message,
			'created_at', i.created_at,
			'course', jsonb_build_object(
				'id', COALESCE(i.course_id::text, ''),
				'title', COALESCE(c.title, ''),
				'thumbnail', c.image_url
			)
		)
		FROM inserted i
		LEFT JOIN courses c ON c.id = i.course_id;
	`

	UpdateUpdate = `
		WITH target AS (
			SELECT id, course_id FROM updates WHERE id = $1
		),
		owned AS (
			SELECT t.id FROM target t
			JOIN courses c ON c.id = t.course_id
			WHERE c.tutor_id = $2
		),
		updated AS (
			UPDATE updates SET message = $3
			WHERE id = $1
			  AND ($4::text = 'admin' OR EXISTS (SELECT 1 FROM owned))
			RETURNING id, course_id, created_by, message, created_at
		)
		SELECT
			(SELECT id::text FROM target) AS db_id,
			(
				SELECT jsonb_build_object(
					'id', u.id,
					'created_by', u.created_by,
					'message', u.message,
					'created_at', u.created_at,
					'course', jsonb_build_object(
						'id', COALESCE(u.course_id::text, ''),
						'title', COALESCE(c.title, ''),
						'thumbnail', c.image_url
					)
				)
				FROM updated u
				LEFT JOIN courses c ON c.id = u.course_id
			) AS data;
	`

	DeleteUpdate = `
		WITH target AS (
			SELECT id, course_id FROM updates WHERE id = $1
		),
		owned AS (
			SELECT t.id FROM target t
			JOIN courses c ON c.id = t.course_id
			WHERE c.tutor_id = $2
		),
		deleted AS (
			DELETE FROM updates
			WHERE id = $1
			  AND ($3::text = 'admin' OR EXISTS (SELECT 1 FROM owned))
			RETURNING id
		)
		SELECT
			(SELECT id::text FROM target) AS db_id,
			(SELECT id::text FROM deleted) AS deleted_id;
	`

	FeedUpdates = `
		WITH current_seen AS (
			SELECT u.created_at AS last_seen_at
			FROM update_seen us
			JOIN updates u ON u.id = us.update_id
			WHERE us.user_id = $1
			ORDER BY u.created_at DESC
			LIMIT 1
		),
		latest_update AS (
			SELECT u.id
			FROM updates u
			WHERE (u.course_id IS NULL OR u.course_id IN (SELECT course_id FROM enrollments WHERE user_id = $1 AND revoked = false))
			ORDER BY u.created_at DESC
			LIMIT 1
		),
		upsert_seen AS (
			INSERT INTO update_seen (user_id, update_id)
			SELECT $1, id FROM latest_update
			ON CONFLICT (user_id, update_id) DO UPDATE SET seen_at = CURRENT_TIMESTAMP
			RETURNING 1
		),
		eligible_updates AS (
			SELECT u.id, u.message, u.created_at,
				   jsonb_build_object(
				   		'id', COALESCE(u.course_id::text, ''),
				   		'title', COALESCE(c.title, ''),
				   		'thumbnail', c.image_url
				   ) AS course,
				   (u.created_at > COALESCE((SELECT last_seen_at FROM current_seen), '-infinity'::timestamptz)) AS is_unseen
			FROM updates u
			LEFT JOIN courses c ON c.id = u.course_id
			WHERE (u.course_id IS NULL OR u.course_id IN (SELECT course_id FROM enrollments WHERE user_id = $1 AND revoked = false))
		),
		count_cte AS (
			SELECT COUNT(*) AS total FROM eligible_updates
		),
		data_cte AS (
			SELECT id, message, created_at, course, is_unseen
			FROM eligible_updates
			ORDER BY is_unseen DESC, created_at DESC
			LIMIT $2 OFFSET $3
		)
		SELECT
			COALESCE((SELECT total FROM count_cte), 0) AS total,
			COALESCE((SELECT jsonb_agg(data_cte) FROM data_cte), '[]'::jsonb) AS updates;
	`

	DefaultUpdatesWhere = "1=1"
	TutorUpdatesWhere   = "u.course_id IN (SELECT id FROM courses WHERE tutor_id = $3)"
)

func BuildListUpdatesQuery(where string) string {
	return fmt.Sprintf(`
		SELECT jsonb_build_object(
			'total', COALESCE((SELECT COUNT(*) FROM updates u WHERE %s), 0),
			'data', COALESCE((
				SELECT jsonb_agg(
					jsonb_build_object(
						'id', u.id,
						'created_by', u.created_by,
						'message', u.message,
						'created_at', u.created_at,
						'course', jsonb_build_object(
							'id', COALESCE(u.course_id::text, ''),
							'title', COALESCE(c.title, ''),
							'thumbnail', c.image_url
						)
					) ORDER BY u.created_at DESC
				)
				FROM (
					SELECT * FROM updates u
					WHERE %s
					ORDER BY u.created_at DESC
					LIMIT $1 OFFSET $2
				) u
				LEFT JOIN courses c ON c.id = u.course_id
			), '[]'::jsonb)
		);
	`, where, where)
}
