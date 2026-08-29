package chapters

const (
	ListAdmin = `
		SELECT COALESCE(
			jsonb_agg(
				jsonb_build_object(
					'id', ch.id,
					'course_id', ch.course_id,
					'chapter_no', ch.chapter_no,
					'title', ch.title,
					'total_lectures', ch.total_lectures,
					'total_duration_seconds', ch.total_duration_seconds,
					'created_at', ch.created_at,
					'updated_at', ch.updated_at
				) ORDER BY ch.chapter_no ASC
			), '[]'::jsonb
		)
		FROM chapters ch
		WHERE ch.course_id = $1;
	`

	ListScoped = `
		WITH auth_check AS (
			SELECT
				CASE
					WHEN NOT EXISTS(SELECT 1 FROM courses WHERE id = $1) THEN 0
					WHEN NOT EXISTS(SELECT 1 FROM courses WHERE id = $1 AND tutor_id = $2) THEN 1
					ELSE 2
				END as status_code
		)
		SELECT
			ac.status_code AS status_flag,
			COALESCE(
				(
					SELECT jsonb_agg(
						jsonb_build_object(
							'id', ch.id,
							'course_id', ch.course_id,
							'chapter_no', ch.chapter_no,
							'title', ch.title,
							'total_lectures', ch.total_lectures,
							'total_duration_seconds', ch.total_duration_seconds,
							'created_at', ch.created_at,
							'updated_at', ch.updated_at
						) ORDER BY ch.chapter_no ASC
					)
					FROM chapters ch
					WHERE ch.course_id = $1
				), '[]'::jsonb
			) AS data_json
		FROM auth_check ac;
	`

	CreateChapter = `
		WITH status_check AS (
			SELECT
				CASE
					WHEN NOT EXISTS(SELECT 1 FROM courses WHERE id = $1) THEN 0
					WHEN NOT EXISTS(SELECT 1 FROM courses WHERE id = $1 AND tutor_id = $2) THEN 1
					ELSE 2
				END as status_code
		),
		next_no AS (
			SELECT COALESCE(MAX(chapter_no), 0) + 1 AS n FROM chapters WHERE course_id = $1
		),
		inserted AS (
			INSERT INTO chapters (course_id, chapter_no, title)
			SELECT $1, next_no.n, $3
			FROM status_check, next_no
			WHERE status_check.status_code = 2
			RETURNING id, course_id, chapter_no, title, total_lectures, total_duration_seconds, created_at, updated_at
		)
		SELECT
			sc.status_code AS status_flag,
			COALESCE(
				(
					SELECT jsonb_build_object(
						'id', i.id,
						'course_id', i.course_id,
						'chapter_no', i.chapter_no,
						'title', i.title,
						'total_lectures', i.total_lectures,
						'total_duration_seconds', i.total_duration_seconds,
						'created_at', i.created_at,
						'updated_at', i.updated_at
					) FROM inserted i
				), '{}'::jsonb
			) AS data_json
		FROM status_check sc;
	`

	UpdateChapter = `
		WITH status_check AS (
			SELECT
				CASE
					WHEN NOT EXISTS(SELECT 1 FROM chapters WHERE id = $1) THEN 0
					WHEN NOT EXISTS(
						SELECT 1 FROM chapters ch
						JOIN courses co ON ch.course_id = co.id
						WHERE ch.id = $1 AND co.tutor_id = $2
					) THEN 1
					ELSE 2
				END as status_code
		),
		updated AS (
			UPDATE chapters ch
			SET
				title = COALESCE($3, ch.title),
				updated_at = CURRENT_TIMESTAMP
			FROM courses co
			WHERE ch.course_id = co.id AND co.tutor_id = $2 AND ch.id = $1
			RETURNING ch.id, ch.course_id, ch.chapter_no, ch.title, ch.total_lectures, ch.total_duration_seconds, ch.created_at, ch.updated_at
		)
		SELECT
			sc.status_code AS status_flag,
			COALESCE(
				(
					SELECT jsonb_build_object(
						'id', u.id,
						'course_id', u.course_id,
						'chapter_no', u.chapter_no,
						'title', u.title,
						'total_lectures', u.total_lectures,
						'total_duration_seconds', u.total_duration_seconds,
						'created_at', u.created_at,
						'updated_at', u.updated_at
					) FROM updated u
				), '{}'::jsonb
			) AS data_json
		FROM status_check sc;
	`

	DeleteChapter = `
		WITH status_check AS (
			SELECT
				CASE
					WHEN NOT EXISTS(SELECT 1 FROM chapters WHERE id = $1) THEN 0
					WHEN NOT EXISTS(
						SELECT 1 FROM chapters ch
						JOIN courses co ON ch.course_id = co.id
						WHERE ch.id = $1 AND co.tutor_id = $2
					) THEN 1
					ELSE 2
				END as status_code
		),
		deleted AS (
			DELETE FROM chapters ch
			USING courses co
			WHERE ch.course_id = co.id AND co.tutor_id = $2 AND ch.id = $1
			RETURNING ch.id
		)
		SELECT
			sc.status_code AS status_flag,
			COALESCE(
				(SELECT jsonb_build_object('id', d.id) FROM deleted d), '{}'::jsonb
			) AS data_json
		FROM status_check sc;
	`
)
