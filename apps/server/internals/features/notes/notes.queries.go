package notes

const (
	UpsertNote = `
		WITH lesson_info AS (
			SELECT l.id AS lesson_id, ch.course_id
			FROM lessons l
			JOIN chapters ch ON ch.id = l.chapter_id
			WHERE l.id = $2
		),
		enrollment_auth AS (
			SELECT EXISTS (
				SELECT 1 FROM enrollments e
				JOIN lesson_info li ON e.course_id = li.course_id
				WHERE e.user_id = $1 AND e.revoked = false
			) AS is_enrolled
		),
		inserted AS (
			INSERT INTO notes (user_id, lesson_id, course_id, content, updated_at)
			SELECT $1, $2, li.course_id, $3, CURRENT_TIMESTAMP
			FROM lesson_info li
			CROSS JOIN enrollment_auth ea
			WHERE ea.is_enrolled = true
			ON CONFLICT (user_id, lesson_id) DO UPDATE SET content = $3, updated_at = CURRENT_TIMESTAMP
			RETURNING id, content, updated_at
		)
		SELECT
			EXISTS(SELECT 1 FROM lesson_info) AS lesson_exists,
			COALESCE((SELECT is_enrolled FROM enrollment_auth), false) AS is_enrolled,
			(SELECT row_to_json(inserted.*) FROM inserted) AS inserted_data;
	`

	ReadNote = `
		WITH lesson_info AS (
			SELECT l.id AS lesson_id, ch.course_id
			FROM lessons l
			JOIN chapters ch ON ch.id = l.chapter_id
			WHERE l.id = $2
		),
		enrollment_auth AS (
			SELECT EXISTS (
				SELECT 1 FROM enrollments e
				JOIN lesson_info li ON e.course_id = li.course_id
				WHERE e.user_id = $1 AND e.revoked = false
			) AS is_enrolled
		),
		note_data AS (
			SELECT id, user_id, lesson_id, course_id, content, updated_at
			FROM notes
			WHERE user_id = $1 AND lesson_id = $2
		)
		SELECT
			EXISTS(SELECT 1 FROM lesson_info) AS lesson_exists,
			COALESCE((SELECT is_enrolled FROM enrollment_auth), false) AS is_enrolled,
			(SELECT row_to_json(note_data.*) FROM note_data) AS note_json;
	`

	UpdateNote = `
		WITH note_info AS (
			SELECT id, user_id, lesson_id, course_id FROM notes WHERE id = $1
		),
		enrollment_auth AS (
			SELECT EXISTS (
				SELECT 1 FROM enrollments e
				JOIN note_info ni ON e.course_id = ni.course_id
				WHERE e.user_id = $2 AND e.revoked = false
			) AS is_enrolled
		),
		updated AS (
			UPDATE notes SET content = $3, updated_at = CURRENT_TIMESTAMP
			FROM note_info ni
			CROSS JOIN enrollment_auth ea
			WHERE notes.id = $1 AND notes.user_id = $2 AND ea.is_enrolled = true
			RETURNING notes.id, notes.content, notes.updated_at
		)
		SELECT
			EXISTS(SELECT 1 FROM note_info) AS note_exists,
			EXISTS(SELECT 1 FROM note_info WHERE user_id = $2) AS is_owner,
			COALESCE((SELECT is_enrolled FROM enrollment_auth), false) AS is_enrolled,
			(SELECT row_to_json(updated.*) FROM updated) AS updated_data;
	`

	DeleteNote = `
		WITH note_info AS (
			SELECT id, user_id, lesson_id, course_id FROM notes WHERE id = $1
		),
		enrollment_auth AS (
			SELECT EXISTS (
				SELECT 1 FROM enrollments e
				JOIN note_info ni ON e.course_id = ni.course_id
				WHERE e.user_id = $2 AND e.revoked = false
			) AS is_enrolled
		),
		deleted AS (
			DELETE FROM notes
			USING note_info ni, enrollment_auth ea
			WHERE notes.id = $1 AND notes.user_id = $2 AND ea.is_enrolled = true
			RETURNING notes.id
		)
		SELECT
			EXISTS(SELECT 1 FROM note_info) AS note_exists,
			EXISTS(SELECT 1 FROM note_info WHERE user_id = $2) AS is_owner,
			COALESCE((SELECT is_enrolled FROM enrollment_auth), false) AS is_enrolled,
			(SELECT id FROM deleted) AS deleted_id;
	`
)
