package faqs

const (
	ListAdmin = `
		SELECT COALESCE(
			jsonb_agg(
				jsonb_build_object(
					'id', f.id,
					'course_id', f.course_id,
					'question', f.question,
					'answer', f.answer,
					'sort_order', f.sort_order,
					'created_at', f.created_at,
					'updated_at', f.updated_at
				) ORDER BY f.sort_order ASC
			), '[]'::jsonb
		)
		FROM faqs f
		WHERE f.course_id = $1;
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
							'id', f.id,
							'course_id', f.course_id,
							'question', f.question,
							'answer', f.answer,
							'sort_order', f.sort_order,
							'created_at', f.created_at,
							'updated_at', f.updated_at
						) ORDER BY f.sort_order ASC
					)
					FROM faqs f
					WHERE f.course_id = $1
				), '[]'::jsonb
			) AS data_json
		FROM auth_check ac;
	`

	PublicList = `
		SELECT COALESCE(
			jsonb_agg(
				jsonb_build_object(
					'id', f.id,
					'course_id', f.course_id,
					'question', f.question,
					'answer', f.answer,
					'sort_order', f.sort_order,
					'created_at', f.created_at,
					'updated_at', f.updated_at
				) ORDER BY f.sort_order ASC
			), '[]'::jsonb
		)
		FROM faqs f
		JOIN courses c ON c.id = f.course_id
		WHERE f.course_id = $1 AND c.status = 'published';
	`

	CreateFaq = `
		WITH status_check AS (
			SELECT
				CASE
					WHEN NOT EXISTS(SELECT 1 FROM courses WHERE id = $1) THEN 0
					WHEN NOT EXISTS(SELECT 1 FROM courses WHERE id = $1 AND tutor_id = $2) THEN 1
					ELSE 2
				END as status_code
		),
		next_no AS (
			SELECT COALESCE(MAX(sort_order), 0) + 1 AS n FROM faqs WHERE course_id = $1
		),
		inserted AS (
			INSERT INTO faqs (course_id, question, answer, sort_order)
			SELECT $1, $3, $4, next_no.n
			FROM status_check, next_no
			WHERE status_check.status_code = 2
			RETURNING id, course_id, question, answer, sort_order, created_at, updated_at
		)
		SELECT
			sc.status_code AS status_flag,
			COALESCE(
				(
					SELECT jsonb_build_object(
						'id', i.id,
						'course_id', i.course_id,
						'question', i.question,
						'answer', i.answer,
						'sort_order', i.sort_order,
						'created_at', i.created_at,
						'updated_at', i.updated_at
					) FROM inserted i
				), '{}'::jsonb
			) AS data_json
		FROM status_check sc;
	`

	UpdateFaq = `
		WITH status_check AS (
			SELECT
				CASE
					WHEN NOT EXISTS(SELECT 1 FROM faqs WHERE id = $1) THEN 0
					WHEN NOT EXISTS(
						SELECT 1 FROM faqs f
						JOIN courses co ON f.course_id = co.id
						WHERE f.id = $1 AND co.tutor_id = $2
					) THEN 1
					ELSE 2
				END as status_code
		),
		updated AS (
			UPDATE faqs f
			SET
				question = COALESCE($3, f.question),
				answer = COALESCE($4, f.answer),
				updated_at = CURRENT_TIMESTAMP
			FROM courses co
			WHERE f.course_id = co.id AND co.tutor_id = $2 AND f.id = $1
			RETURNING f.id, f.course_id, f.question, f.answer, f.sort_order, f.created_at, f.updated_at
		)
		SELECT
			sc.status_code AS status_flag,
			COALESCE(
				(
					SELECT jsonb_build_object(
						'id', u.id,
						'course_id', u.course_id,
						'question', u.question,
						'answer', u.answer,
						'sort_order', u.sort_order,
						'created_at', u.created_at,
						'updated_at', u.updated_at
					) FROM updated u
				), '{}'::jsonb
			) AS data_json
		FROM status_check sc;
	`

	DeleteFaq = `
		WITH status_check AS (
			SELECT
				CASE
					WHEN NOT EXISTS(SELECT 1 FROM faqs WHERE id = $1) THEN 0
					WHEN NOT EXISTS(
						SELECT 1 FROM faqs f
						JOIN courses co ON f.course_id = co.id
						WHERE f.id = $1 AND co.tutor_id = $2
					) THEN 1
					ELSE 2
				END as status_code
		),
		deleted AS (
			DELETE FROM faqs f
			USING courses co
			WHERE f.course_id = co.id AND co.tutor_id = $2 AND f.id = $1
			RETURNING f.id
		)
		SELECT
			sc.status_code AS status_flag,
			COALESCE(
				(SELECT jsonb_build_object('id', d.id) FROM deleted d), '{}'::jsonb
			) AS data_json
		FROM status_check sc;
	`
)
