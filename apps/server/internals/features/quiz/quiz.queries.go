package quiz

const (
	CreateMetadata = `
		WITH lesson_auth AS (
			SELECT c.tutor_id
			FROM lessons l
			JOIN chapters ch ON ch.id = l.chapter_id
			JOIN courses c ON c.id = ch.course_id
			WHERE l.id = $1
		),
		inserted AS (
			INSERT INTO quiz_metadata (lesson_id, title, time_limit_seconds, pass_score_percent)
			SELECT $1, $2, $3, $4
			FROM lesson_auth la
			WHERE la.tutor_id = $5
			ON CONFLICT (lesson_id) DO UPDATE SET title = $2, time_limit_seconds = $3, pass_score_percent = $4
			RETURNING id, lesson_id, title, time_limit_seconds, total_questions, pass_score_percent
		)
		SELECT
			EXISTS(SELECT 1 FROM lesson_auth) AS lesson_exists,
			EXISTS(SELECT 1 FROM lesson_auth WHERE tutor_id = $5) AS is_owner,
			(SELECT row_to_json(inserted.*) FROM inserted) AS data;
	`

	ReadMetadata = `
		WITH lesson_auth AS (
			SELECT c.tutor_id
			FROM lessons l
			JOIN chapters ch ON ch.id = l.chapter_id
			JOIN courses c ON c.id = ch.course_id
			WHERE l.id = $1
		)
		SELECT
			EXISTS(SELECT 1 FROM lesson_auth) AS lesson_exists,
			CASE WHEN $2::text = 'admin' THEN true ELSE EXISTS(SELECT 1 FROM lesson_auth WHERE tutor_id = $3) END AS is_owner,
			(SELECT row_to_json(qm.*) FROM quiz_metadata qm WHERE qm.lesson_id = $1) AS data;
	`

	ListQuestions = `
		WITH quiz_auth AS (
			SELECT c.tutor_id
			FROM quiz_metadata qm
			JOIN lessons l ON l.id = qm.lesson_id
			JOIN chapters ch ON ch.id = l.chapter_id
			JOIN courses c ON c.id = ch.course_id
			WHERE qm.id = $1
		)
		SELECT
			EXISTS(SELECT 1 FROM quiz_auth) AS quiz_exists,
			CASE WHEN $2::text = 'admin' THEN true ELSE EXISTS(SELECT 1 FROM quiz_auth WHERE tutor_id = $3) END AS is_owner,
			COALESCE((
				SELECT jsonb_agg(
					jsonb_build_object(
						'id', q.id,
						'quiz_id', q.quiz_id,
						'question_type', q.question_type,
						'question_text', q.question_text,
						'points', q.points,
						'fill_blank_hint', q.fill_blank_hint,
						'created_at', q.created_at,
						'updated_at', q.updated_at,
						'options', COALESCE((
							SELECT jsonb_agg(jsonb_build_object(
								'id', o.id,
								'question_id', o.question_id,
								'option_text', o.option_text,
								'is_correct', o.is_correct,
								'sort_order', o.sort_order,
								'created_at', o.created_at
							) ORDER BY o.sort_order)
							FROM quiz_options o WHERE o.question_id = q.id
						), '[]'::jsonb),
						'arrange_items', COALESCE((
							SELECT jsonb_agg(jsonb_build_object(
								'id', ai.id,
								'question_id', ai.question_id,
								'item_text', ai.item_text,
								'correct_order', ai.correct_order,
								'created_at', ai.created_at
							) ORDER BY ai.correct_order)
							FROM quiz_arrange_items ai WHERE ai.question_id = q.id
						), '[]'::jsonb),
						'fill_answers', COALESCE((
							SELECT jsonb_agg(jsonb_build_object(
								'id', fba.id,
								'question_id', fba.question_id,
								'answer', fba.answer,
								'created_at', fba.created_at
							))
							FROM quiz_fill_blank_answers fba WHERE fba.question_id = q.id
						), '[]'::jsonb)
					) ORDER BY q.created_at, q.id
				)
				FROM quiz_questions q WHERE q.quiz_id = $1
			), '[]'::jsonb) AS data;
	`

	CreateQuestion = `
		WITH question_auth AS (
			SELECT c.tutor_id
			FROM quiz_metadata qm
			JOIN lessons l ON l.id = qm.lesson_id
			JOIN chapters ch ON ch.id = l.chapter_id
			JOIN courses c ON c.id = ch.course_id
			WHERE qm.id = $1
		),
		inserted_question AS (
			INSERT INTO quiz_questions (quiz_id, question_type, question_text, points, fill_blank_hint)
			SELECT $1, $3, $4, $5, $6
			FROM question_auth qa
			WHERE qa.tutor_id = $2
			RETURNING id, quiz_id, question_type, question_text, points, fill_blank_hint
		),
		inserted_options AS (
			INSERT INTO quiz_options (question_id, option_text, is_correct)
			SELECT i.id, unnest($7::text[]), unnest($8::boolean[])
			FROM inserted_question i
			WHERE array_length($7::text[], 1) > 0
			RETURNING id
		),
		inserted_arrange_items AS (
			INSERT INTO quiz_arrange_items (question_id, item_text, correct_order)
			SELECT i.id, unnest($9::text[]), unnest($10::int8[])
			FROM inserted_question i
			WHERE array_length($9::text[], 1) > 0
			RETURNING id
		),
		inserted_fill_answers AS (
			INSERT INTO quiz_fill_blank_answers (question_id, answer)
			SELECT i.id, unnest($11::text[])
			FROM inserted_question i
			WHERE array_length($11::text[], 1) > 0
			RETURNING id
		)
		SELECT
			EXISTS(SELECT 1 FROM question_auth) AS quiz_exists,
			EXISTS(SELECT 1 FROM question_auth WHERE tutor_id = $2) AS is_owner,
			(SELECT row_to_json(inserted_question.*) FROM inserted_question) AS question_data;
	`

	DeleteQuestion = `
		WITH question_auth AS (
			SELECT c.tutor_id
			FROM quiz_questions qq
			JOIN quiz_metadata qm ON qm.id = qq.quiz_id
			JOIN lessons l ON l.id = qm.lesson_id
			JOIN chapters ch ON ch.id = l.chapter_id
			JOIN courses c ON c.id = ch.course_id
			WHERE qq.id = $1
		),
		deleted AS (
			DELETE FROM quiz_questions qq
			USING question_auth qa
			WHERE qq.id = $1 AND qa.tutor_id = $2
			RETURNING qq.id
		)
		SELECT
			EXISTS(SELECT 1 FROM question_auth) AS question_exists,
			EXISTS(SELECT 1 FROM question_auth WHERE tutor_id = $2) AS is_owner,
			(SELECT id FROM deleted) AS deleted_id;
	`

	GetQuizEvaluation = `
		WITH quiz_info AS (
			SELECT qm.id, ch.course_id
			FROM quiz_metadata qm
			JOIN lessons l ON l.id = qm.lesson_id
			JOIN chapters ch ON ch.id = l.chapter_id
			WHERE qm.id = $1
		),
		enrollment_auth AS (
			SELECT EXISTS (
				SELECT 1 FROM enrollments e
				JOIN quiz_info qi ON e.course_id = qi.course_id
				WHERE e.user_id = $2 AND e.revoked = false
			) AS is_enrolled
		),
		q_options AS (
			SELECT o.question_id, jsonb_agg(o.id) AS correct_option_ids
			FROM quiz_options o
			JOIN quiz_questions qq ON qq.id = o.question_id
			WHERE qq.quiz_id = $1 AND o.is_correct = true
			GROUP BY o.question_id
		),
		q_arrange AS (
			SELECT ai.question_id, jsonb_agg(ai.correct_order ORDER BY ai.correct_order) AS correct_arrange_order
			FROM quiz_arrange_items ai
			JOIN quiz_questions qq ON qq.id = ai.question_id
			WHERE qq.quiz_id = $1
			GROUP BY ai.question_id
		),
		q_fill AS (
			SELECT fba.question_id, jsonb_agg(fba.answer) AS correct_fill_answers
			FROM quiz_fill_blank_answers fba
			JOIN quiz_questions qq ON qq.id = fba.question_id
			WHERE qq.quiz_id = $1
			GROUP BY fba.question_id
		)
		SELECT
			EXISTS(SELECT 1 FROM quiz_info) AS quiz_exists,
			COALESCE((SELECT is_enrolled FROM enrollment_auth), false) AS is_enrolled,
			COALESCE(qm.pass_score_percent, 0) AS pass_score_percent,
			COALESCE(
				jsonb_agg(
					jsonb_build_object(
						'id', q.id,
						'question_type', q.question_type,
						'points', q.points,
						'correct_option_ids', COALESCE(qo.correct_option_ids, '[]'::jsonb),
						'correct_arrange_order', COALESCE(qa.correct_arrange_order, '[]'::jsonb),
						'correct_fill_answers', COALESCE(qf.correct_fill_answers, '[]'::jsonb)
					)
				) FILTER (WHERE q.id IS NOT NULL), '[]'::jsonb
			) AS questions
		FROM quiz_metadata qm
		LEFT JOIN quiz_questions q ON q.quiz_id = qm.id
		LEFT JOIN q_options qo ON qo.question_id = q.id
		LEFT JOIN q_arrange qa ON qa.question_id = q.id
		LEFT JOIN q_fill qf ON qf.question_id = q.id
		WHERE qm.id = $1
		GROUP BY qm.id, qm.pass_score_percent;
	`

	ListAttempts = `
		SELECT COALESCE(
			jsonb_agg(
				jsonb_build_object(
					'id', id, 'started_at', started_at, 'submitted_at', submitted_at,
					'total_score', total_score, 'passed', passed,
					'correct_count', correct_count, 'incorrect_count', incorrect_count,
					'skipped_count', skipped_count
				) ORDER BY started_at DESC
			), '[]'::jsonb
		)
		FROM quiz_attempts
		WHERE quiz_id = $1 AND user_id = $2;
	`

	GetAttemptDetail = `
		WITH attempt_check AS (
			SELECT qa.id AS attempt_id, qa.quiz_id, qm.title AS quiz_title, qa.total_score, qa.passed
			FROM quiz_attempts qa
			JOIN quiz_metadata qm ON qm.id = qa.quiz_id
			WHERE qa.id = $1 AND qa.user_id = $2
		),
		single_rows AS (
			SELECT sa.question_id, sa.is_correct, sa.is_skipped,
			       COALESCE(so.option_text, '') AS your_answer,
			       COALESCE((SELECT co.option_text FROM quiz_options co WHERE co.question_id = sa.question_id AND co.is_correct = true LIMIT 1), '') AS correct_answer,
			       COALESCE((
			       	SELECT jsonb_agg(jsonb_build_object(
			       		'option_id', o.id,
			       		'option_text', o.option_text,
			       		'is_correct', o.is_correct,
			       		'is_selected', o.id = sa.selected_option_id
			       	) ORDER BY o.sort_order)
			       	FROM quiz_options o WHERE o.question_id = sa.question_id
			       ), '[]'::jsonb) AS options,
			       '[]'::jsonb AS arrange_items,
			       '[]'::jsonb AS fill_answers
			FROM quiz_attempt_single_answers sa
			JOIN attempt_check ac ON ac.attempt_id = sa.attempt_id
			LEFT JOIN quiz_options so ON so.id = sa.selected_option_id
		),
		multi_rows AS (
			SELECT ma.question_id, ma.is_correct, ma.is_skipped,
			       COALESCE((SELECT string_agg(mo.option_text, ', ') FROM quiz_attempt_multi_answer_options mao JOIN quiz_options mo ON mo.id = mao.selected_option_id WHERE mao.multi_answer_id = ma.id), '') AS your_answer,
			       COALESCE((SELECT string_agg(co.option_text, ', ') FROM quiz_options co WHERE co.question_id = ma.question_id AND co.is_correct = true), '') AS correct_answer,
			       COALESCE((
			       	SELECT jsonb_agg(jsonb_build_object(
			       		'option_id', o.id,
			       		'option_text', o.option_text,
			       		'is_correct', o.is_correct,
			       		'is_selected', EXISTS (
			       			SELECT 1 FROM quiz_attempt_multi_answer_options mao
			       			WHERE mao.multi_answer_id = ma.id AND mao.selected_option_id = o.id
			       		)
			       	) ORDER BY o.sort_order)
			       	FROM quiz_options o WHERE o.question_id = ma.question_id
			       ), '[]'::jsonb) AS options,
			       '[]'::jsonb AS arrange_items,
			       '[]'::jsonb AS fill_answers
			FROM quiz_attempt_multi_answers ma
			JOIN attempt_check ac ON ac.attempt_id = ma.attempt_id
		),
		arrange_rows AS (
			SELECT aa.question_id,
			       bool_and(aa.is_correct) AS is_correct,
			       bool_and(aa.is_skipped) AS is_skipped,
			       string_agg(ai.item_text, ' -> ' ORDER BY aa.submitted_order) AS your_answer,
			       (SELECT string_agg(ai2.item_text, ' -> ' ORDER BY ai2.correct_order) FROM quiz_arrange_items ai2 WHERE ai2.question_id = aa.question_id) AS correct_answer,
			       '[]'::jsonb AS options,
			       COALESCE((
			       	SELECT jsonb_agg(jsonb_build_object(
			       		'item_id', ai3.id,
			       		'item_text', ai3.item_text,
			       		'correct_order', ai3.correct_order,
			       		'submitted_order', aa3.submitted_order
			       	) ORDER BY ai3.correct_order)
			       	FROM quiz_arrange_items ai3
			       	LEFT JOIN quiz_attempt_arrange_answers aa3
			       	  ON aa3.arrange_item_id = ai3.id AND aa3.attempt_id = aa.attempt_id
			       	WHERE ai3.question_id = aa.question_id
			       ), '[]'::jsonb) AS arrange_items,
			       '[]'::jsonb AS fill_answers
			FROM quiz_attempt_arrange_answers aa
			JOIN attempt_check ac ON ac.attempt_id = aa.attempt_id
			JOIN quiz_arrange_items ai ON ai.id = aa.arrange_item_id
			GROUP BY aa.question_id, aa.attempt_id
		),
		fill_rows AS (
			SELECT fa.question_id, fa.is_correct, fa.is_skipped,
			       fa.fill_text AS your_answer,
			       COALESCE((SELECT string_agg(fba.answer, ' / ') FROM quiz_fill_blank_answers fba WHERE fba.question_id = fa.question_id), '') AS correct_answer,
			       '[]'::jsonb AS options,
			       '[]'::jsonb AS arrange_items,
			       COALESCE((
			       	SELECT jsonb_agg(fba2.answer)
			       	FROM quiz_fill_blank_answers fba2 WHERE fba2.question_id = fa.question_id
			       ), '[]'::jsonb) AS fill_answers
			FROM quiz_attempt_fill_answers fa
			JOIN attempt_check ac ON ac.attempt_id = fa.attempt_id
		),
		all_rows AS (
			SELECT * FROM single_rows
			UNION ALL SELECT * FROM multi_rows
			UNION ALL SELECT * FROM arrange_rows
			UNION ALL SELECT * FROM fill_rows
		)
		SELECT
			EXISTS(SELECT 1 FROM attempt_check) AS attempt_exists,
			COALESCE((SELECT quiz_title FROM attempt_check), '') AS quiz_title,
			COALESCE((SELECT total_score FROM attempt_check), 0) AS total_score,
			COALESCE((SELECT passed FROM attempt_check), false) AS passed,
			COALESCE(
				jsonb_agg(
					jsonb_build_object(
						'question_id', ar.question_id,
						'question_type', qq.question_type,
						'question_text', qq.question_text,
						'points', qq.points,
						'is_correct', ar.is_correct,
						'is_skipped', ar.is_skipped,
						'your_answer', ar.your_answer,
						'correct_answer', ar.correct_answer,
						'options', ar.options,
						'arrange_items', ar.arrange_items,
						'fill_answers', ar.fill_answers
					) ORDER BY qq.created_at
				) FILTER (WHERE ar.question_id IS NOT NULL), '[]'::jsonb
			) AS questions
		FROM all_rows ar
		JOIN quiz_questions qq ON qq.id = ar.question_id;
	`

	CheckQuestionOwner = `
		SELECT
			EXISTS(SELECT 1 FROM quiz_questions WHERE id = $1) AS question_exists,
			EXISTS(
				SELECT 1 FROM quiz_questions qq
				JOIN quiz_metadata qm ON qm.id = qq.quiz_id
				JOIN lessons l ON l.id = qm.lesson_id
				JOIN chapters ch ON ch.id = l.chapter_id
				JOIN courses c ON c.id = ch.course_id
				WHERE qq.id = $1 AND c.tutor_id = $2
			) AS is_owner;
	`

	UpdateQuestion = `
		UPDATE quiz_questions
		SET question_type = $2, question_text = $3, points = $4, fill_blank_hint = $5, updated_at = CURRENT_TIMESTAMP
		WHERE id = $1
		RETURNING id, quiz_id, question_type, question_text, points, fill_blank_hint, created_at, updated_at;
	`

	DeleteQuestionOptions = `DELETE FROM quiz_options WHERE question_id = $1;`

	DeleteQuestionArrangeItems = `DELETE FROM quiz_arrange_items WHERE question_id = $1;`

	DeleteQuestionFillAnswers = `DELETE FROM quiz_fill_blank_answers WHERE question_id = $1;`

	InsertQuestionOption = `INSERT INTO quiz_options (question_id, option_text, is_correct) VALUES ($1, $2, $3);`

	InsertQuestionArrangeItem = `INSERT INTO quiz_arrange_items (question_id, item_text, correct_order) VALUES ($1, $2, $3);`

	InsertQuestionFillAnswer = `INSERT INTO quiz_fill_blank_answers (question_id, answer) VALUES ($1, $2);`

	CheckQuizEnrollment = `
		SELECT EXISTS (
			SELECT 1 FROM enrollments e
			JOIN quiz_metadata qm ON qm.id = $1
			JOIN lessons l ON l.id = qm.lesson_id
			JOIN chapters ch ON ch.id = l.chapter_id
			WHERE e.user_id = $2 AND e.course_id = ch.course_id AND e.revoked = false
		);
	`

	InsertQuizAttempt = `
		INSERT INTO quiz_attempts (quiz_id, user_id, submitted_at, total_score, passed, correct_count, incorrect_count, skipped_count)
		VALUES ($1, $2, NOW(), $3, $4, $5, $6, $7)
		RETURNING id;
	`

	InsertSingleAnswer = `
		INSERT INTO quiz_attempt_single_answers (attempt_id, question_id, selected_option_id, is_correct, is_skipped)
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (attempt_id, question_id) DO NOTHING;
	`

	InsertMultiAnswer = `
		INSERT INTO quiz_attempt_multi_answers (attempt_id, question_id, is_correct, is_skipped)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (attempt_id, question_id) DO UPDATE SET is_correct = EXCLUDED.is_correct
		RETURNING id;
	`

	InsertMultiAnswerOption = `
		INSERT INTO quiz_attempt_multi_answer_options (multi_answer_id, selected_option_id)
		VALUES ($1, $2)
		ON CONFLICT DO NOTHING;
	`

	InsertArrangeAnswer = `
		INSERT INTO quiz_attempt_arrange_answers (attempt_id, question_id, arrange_item_id, submitted_order, is_correct, is_skipped)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (attempt_id, question_id, arrange_item_id) DO NOTHING;
	`

	InsertFillAnswer = `
		INSERT INTO quiz_attempt_fill_answers (attempt_id, question_id, fill_text, is_correct, is_skipped)
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (attempt_id, question_id) DO NOTHING;
	`
)

func BuildNextQuestionQuery(exclude string, countParam string) string {
	return `
		WITH quiz_info AS (
			SELECT qm.id, ch.course_id
			FROM quiz_metadata qm
			JOIN lessons l ON l.id = qm.lesson_id
			JOIN chapters ch ON ch.id = l.chapter_id
			WHERE qm.id = $1
		),
		enrollment_auth AS (
			SELECT EXISTS (
				SELECT 1 FROM enrollments e
				JOIN quiz_info qi ON e.course_id = qi.course_id
				WHERE e.user_id = $2 AND e.revoked = false
			) AS is_enrolled
		),
		selected_question AS (
			SELECT qq.id, qq.quiz_id, qq.question_type, qq.question_text, qq.points, qq.fill_blank_hint
			FROM quiz_questions qq
			CROSS JOIN enrollment_auth ea
			WHERE qq.quiz_id = $1 AND ea.is_enrolled = true ` + exclude + `
			ORDER BY RANDOM() LIMIT 1
		),
		metadata AS (
			SELECT COALESCE(total_questions, 0) as total FROM quiz_metadata WHERE id = $1
		)
		SELECT
			EXISTS(SELECT 1 FROM quiz_info) AS quiz_exists,
			COALESCE((SELECT is_enrolled FROM enrollment_auth), false) AS is_enrolled,
			(SELECT total FROM metadata) - ` + countParam + `::int AS remaining_count,
			(
				SELECT jsonb_build_object(
					'question', sq.*,
					'options', COALESCE((
						SELECT jsonb_agg(o.* ORDER BY o.sort_order, RANDOM())
						FROM quiz_options o WHERE o.question_id = sq.id AND sq.question_type IN ('single_choice', 'multi_choice')
					), '[]'::jsonb),
					'arrange_items', COALESCE((
						SELECT jsonb_agg(ai.* ORDER BY RANDOM())
						FROM quiz_arrange_items ai WHERE ai.question_id = sq.id AND sq.question_type = 'arrange'
					), '[]'::jsonb)
				)
				FROM selected_question sq
			) AS question_json;
	`
}
