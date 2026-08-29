package lessons

import (
	"fmt"

	"coursehunt/server/internals/generic"
)

const (
	ReadContentForTutor = `
		WITH lesson_info AS (
			SELECT l.id AS lesson_id, l.lesson_type, c.tutor_id
			FROM lessons l
			JOIN chapters ch ON ch.id = l.chapter_id
			JOIN courses c ON c.id = ch.course_id
			WHERE l.id = $1
		),
		content_cte AS (
			SELECT
				li.lesson_type,
				CASE
					WHEN li.lesson_type = 'video' THEN (
						SELECT jsonb_build_object(
							'lesson_id', vc.lesson_id,
							'video_url', vc.video_url,
							'written_content', vc.written_content,
							'created_at', vc.created_at,
							'updated_at', vc.updated_at
						)
						FROM lesson_video_content vc
						WHERE vc.lesson_id = li.lesson_id
					)
					ELSE NULL
				END AS video_content,
				CASE
					WHEN li.lesson_type = 'document' THEN (
						SELECT jsonb_build_object(
							'lesson_id', dc.lesson_id,
							'content', dc.content,
							'created_at', dc.created_at,
							'updated_at', dc.updated_at
						)
						FROM lesson_document_content dc
						WHERE dc.lesson_id = li.lesson_id
					)
					ELSE NULL
				END AS document_content,
				CASE
					WHEN li.lesson_type = 'quiz' THEN (
						SELECT jsonb_build_object(
							'id', qm.id,
							'lesson_id', qm.lesson_id,
							'title', qm.title,
							'time_limit_seconds', qm.time_limit_seconds,
							'total_questions', qm.total_questions,
							'pass_score_percent', qm.pass_score_percent,
							'created_at', qm.created_at,
							'updated_at', qm.updated_at
						)
						FROM quiz_metadata qm
						WHERE qm.lesson_id = li.lesson_id
					)
					ELSE NULL
				END AS quiz_content
			FROM lesson_info li
			WHERE li.tutor_id = $2
		)
		SELECT
			EXISTS(SELECT 1 FROM lesson_info) AS lesson_exists,
			EXISTS(SELECT 1 FROM lesson_info WHERE tutor_id = $2) AS is_owner,
			(SELECT row_to_json(content_cte.*) FROM content_cte) AS content_data;
	`

	UpsertVideoContent = `
		WITH auth AS (
			SELECT c.tutor_id
			FROM lessons l
			JOIN chapters ch ON ch.id = l.chapter_id
			JOIN courses c ON c.id = ch.course_id
			WHERE l.id = $1
		),
		before AS (
			SELECT video_url FROM lesson_video_content WHERE lesson_id = $1
		),
		inserted AS (
			INSERT INTO lesson_video_content (lesson_id, video_url, written_content, updated_at)
			SELECT $1, $2, $3, CURRENT_TIMESTAMP
			WHERE EXISTS(SELECT 1 FROM auth WHERE auth.tutor_id = $4)
			ON CONFLICT (lesson_id) DO UPDATE SET video_url = $2, written_content = $3, updated_at = CURRENT_TIMESTAMP
			RETURNING lesson_id, video_url, written_content, created_at, updated_at
		)
		SELECT
			(SELECT tutor_id FROM auth) AS course_tutor_id,
			(SELECT video_url FROM before) AS old_video_url,
			row_to_json(inserted.*) AS inserted_data
		FROM (SELECT 1) dummy
		LEFT JOIN inserted ON true;
	`

	UpsertDocumentContent = `
		WITH auth AS (
			SELECT c.tutor_id
			FROM lessons l
			JOIN chapters ch ON ch.id = l.chapter_id
			JOIN courses c ON c.id = ch.course_id
			WHERE l.id = $1
		),
		inserted AS (
			INSERT INTO lesson_document_content (lesson_id, content, updated_at)
			SELECT $1, $2, CURRENT_TIMESTAMP
			WHERE EXISTS(SELECT 1 FROM auth WHERE auth.tutor_id = $3)
			ON CONFLICT (lesson_id) DO UPDATE SET content = $2, updated_at = CURRENT_TIMESTAMP
			RETURNING lesson_id, content, created_at, updated_at
		)
		SELECT 
			(SELECT tutor_id FROM auth) AS course_tutor_id,
			row_to_json(inserted.*) AS inserted_data
		FROM (SELECT 1) dummy
		LEFT JOIN inserted ON true;
	`

	ListAdmin = `
		SELECT COALESCE(
			jsonb_agg(
				jsonb_build_object(
					'id', id, 'chapter_id', chapter_id, 'lesson_no', lesson_no, 'title', title,
					'lesson_type', lesson_type, 'short_description', short_description,
					'preview_video_url', preview_video_url, 'duration_seconds', duration_seconds,
					'created_at', created_at, 'updated_at', updated_at
				) ORDER BY lesson_no ASC
			), '[]'::jsonb
		)
		FROM lessons
		WHERE chapter_id = $1;
	`

	ListScoped = `
		WITH chapter_auth AS (
			SELECT c.tutor_id
			FROM chapters ch
			JOIN courses c ON c.id = ch.course_id
			WHERE ch.id = $1
		),
		lessons_data AS (
			SELECT l.id, l.chapter_id, l.lesson_no, l.title, l.lesson_type, l.short_description, l.preview_video_url, l.duration_seconds, l.created_at, l.updated_at
			FROM lessons l
			CROSS JOIN chapter_auth ca
			WHERE l.chapter_id = $1 AND ca.tutor_id = $2
			ORDER BY l.lesson_no
		)
		SELECT 
			EXISTS(SELECT 1 FROM chapter_auth) AS chapter_exists,
			EXISTS(SELECT 1 FROM chapter_auth WHERE tutor_id = $2) AS is_owner,
			COALESCE((SELECT jsonb_agg(lessons_data) FROM lessons_data), '[]'::jsonb) AS data;
	`

	CreateLesson = `
		WITH auth AS (
			SELECT c.id AS course_id, c.tutor_id
			FROM chapters ch
			JOIN courses c ON c.id = ch.course_id
			WHERE ch.id = $1
		),
		next_no AS (
			SELECT COALESCE(MAX(lesson_no), 0) + 1 AS n FROM lessons WHERE chapter_id = $1
		),
		inserted AS (
			INSERT INTO lessons (chapter_id, lesson_no, title, lesson_type, short_description, preview_video_url, duration_seconds)
			SELECT $1, next_no.n, $2, $3, $4, NULLIF($5, ''), $6
			FROM auth, next_no
			WHERE auth.tutor_id = $7
			RETURNING *
		)
		SELECT
			(SELECT tutor_id FROM auth) AS course_tutor_id,
			(SELECT id FROM auth) AS course_id,
			row_to_json(inserted.*) AS inserted_data
		FROM (SELECT 1) dummy
		LEFT JOIN inserted ON true;
	`

	UpdateLesson = `
		WITH auth AS (
			SELECT c.tutor_id, l.preview_video_url AS old_preview_video_url
			FROM lessons l
			JOIN chapters ch ON ch.id = l.chapter_id
			JOIN courses c ON c.id = ch.course_id
			WHERE l.id = $1
		),
		updated AS (
			UPDATE lessons SET
				title = COALESCE($3, title),
				short_description = COALESCE($4, short_description),
				preview_video_url = CASE WHEN $5::text IS NULL THEN preview_video_url WHEN $5::text = '' THEN NULL ELSE $5::text END,
				duration_seconds = COALESCE($6, duration_seconds),
				updated_at = CURRENT_TIMESTAMP
			WHERE id = $1 AND EXISTS(SELECT 1 FROM auth WHERE auth.tutor_id = $2)
			RETURNING *
		)
		SELECT
			(SELECT tutor_id FROM auth) AS course_tutor_id,
			(SELECT old_preview_video_url FROM auth) AS old_preview_video_url,
			row_to_json(updated.*) AS updated_data
		FROM (SELECT 1) dummy
		LEFT JOIN updated ON true;
	`

	DeleteLesson = `
		WITH auth AS (
			SELECT c.tutor_id
			FROM lessons l
			JOIN chapters ch ON ch.id = l.chapter_id
			JOIN courses c ON c.id = ch.course_id
			WHERE l.id = $1
		),
		deleted AS (
			DELETE FROM lessons 
			WHERE id = $1 AND EXISTS(SELECT 1 FROM auth WHERE auth.tutor_id = $2)
			RETURNING id
		)
		SELECT 
			(SELECT tutor_id FROM auth) AS course_tutor_id,
			(SELECT id FROM deleted) AS deleted_id;
	`

	MarkLessonComplete = `
		WITH lesson_info AS (
			SELECT ch.course_id
			FROM lessons l
			JOIN chapters ch ON ch.id = l.chapter_id
			WHERE l.id = $1
		),
		enrollment_auth AS (
			SELECT EXISTS (
				SELECT 1 FROM enrollments e
				JOIN lesson_info li ON e.course_id = li.course_id
				WHERE e.user_id = $2 AND e.revoked = false
			) AS is_enrolled
		),
		inserted AS (
			INSERT INTO lesson_progress (user_id, lesson_id, course_id, completed, completed_at)
			SELECT $2, $1, li.course_id, true, CURRENT_TIMESTAMP
			FROM lesson_info li
			CROSS JOIN enrollment_auth ea
			WHERE ea.is_enrolled = true
			ON CONFLICT (user_id, lesson_id) DO UPDATE SET completed = true, completed_at = CURRENT_TIMESTAMP
			RETURNING lesson_id
		)
		SELECT 
			EXISTS(SELECT 1 FROM lesson_info) AS lesson_exists,
			COALESCE((SELECT is_enrolled FROM enrollment_auth), false) AS is_enrolled,
			EXISTS(SELECT 1 FROM inserted) AS completed;
	`

	CreateResource = `
		WITH auth AS (
			SELECT c.tutor_id
			FROM lessons l
			JOIN chapters ch ON ch.id = l.chapter_id
			JOIN courses c ON c.id = ch.course_id
			WHERE l.id = $1
		),
		inserted AS (
			INSERT INTO lesson_resources (lesson_id, title, file_url, file_type)
			SELECT $1, $2, $3, $4
			WHERE EXISTS(SELECT 1 FROM auth WHERE auth.tutor_id = $5)
			RETURNING id, title, file_url, file_type
		)
		SELECT 
			(SELECT tutor_id FROM auth) AS course_tutor_id,
			row_to_json(inserted.*) AS inserted_data
		FROM (SELECT 1) dummy
		LEFT JOIN inserted ON true;
	`

	DeleteResource = `
		WITH auth AS (
			SELECT c.tutor_id
			FROM lesson_resources lr
			JOIN lessons l ON l.id = lr.lesson_id
			JOIN chapters ch ON ch.id = l.chapter_id
			JOIN courses c ON c.id = ch.course_id
			WHERE lr.id = $1
		),
		deleted AS (
			DELETE FROM lesson_resources
			WHERE id = $1 AND EXISTS(SELECT 1 FROM auth WHERE auth.tutor_id = $2)
			RETURNING id, file_url
		)
		SELECT
			(SELECT tutor_id FROM auth) AS course_tutor_id,
			(SELECT id FROM deleted) AS deleted_id,
			(SELECT file_url FROM deleted) AS deleted_file_url;
	`

	ReadResourcesForTutor = `
		WITH lesson_info AS (
			SELECT l.id AS lesson_id, c.tutor_id
			FROM lessons l
			JOIN chapters ch ON ch.id = l.chapter_id
			JOIN courses c ON c.id = ch.course_id
			WHERE l.id = $1
		),
		resources_cte AS (
			SELECT lr.id, lr.lesson_id, lr.title, lr.file_url, lr.file_type
			FROM lesson_resources lr
			JOIN lesson_info li ON li.lesson_id = lr.lesson_id
			WHERE li.tutor_id = $2
		)
		SELECT
			EXISTS(SELECT 1 FROM lesson_info) AS lesson_exists,
			EXISTS(SELECT 1 FROM lesson_info WHERE tutor_id = $2) AS is_owner,
			(SELECT jsonb_agg(resources_cte) FROM resources_cte) AS resources;
	`

	ReadResourcesAdmin = `
		SELECT COALESCE(
			jsonb_agg(
				jsonb_build_object(
					'id', id, 'lesson_id', lesson_id, 'title', title, 'file_url', file_url, 'file_type', file_type
				) ORDER BY id ASC
			), '[]'::jsonb
		)
		FROM lesson_resources
		WHERE lesson_id = $1;
	`

	ReadResourcesScoped = `
		WITH lesson_info AS (
			SELECT l.id AS lesson_id, ch.course_id
			FROM lessons l
			JOIN chapters ch ON ch.id = l.chapter_id
			WHERE l.id = $1
		),
		enrollment_auth AS (
			SELECT EXISTS (
				SELECT 1 FROM enrollments e
				JOIN lesson_info li ON e.course_id = li.course_id
				WHERE e.user_id = $2 AND e.revoked = false
			) AS is_enrolled
		),
		resources_cte AS (
			SELECT lr.id, lr.lesson_id, lr.title, lr.file_url, lr.file_type
			FROM lesson_resources lr
			JOIN enrollment_auth ea ON ea.is_enrolled = true
			WHERE lr.lesson_id = $1
		)
		SELECT 
			EXISTS (SELECT 1 FROM lesson_info) AS lesson_exists,
			COALESCE((SELECT is_enrolled FROM enrollment_auth), false) AS is_enrolled,
			(SELECT jsonb_agg(resources_cte) FROM resources_cte) AS resources;
	`
)

func BuildReadContentQuery(enrollmentCTE, updateCTE, contentWhere string) string {
	return fmt.Sprintf(`
		WITH lesson_info AS (
			SELECT l.id AS lesson_id, l.lesson_type, ch.course_id
			FROM lessons l
			JOIN chapters ch ON ch.id = l.chapter_id
			WHERE l.id = $1
		),
		enrollment_auth AS (%s),
		updated_enrollment AS (%s),
		content_cte AS (
			SELECT 
				li.lesson_type,
				CASE 
					WHEN li.lesson_type = 'video' THEN (
						SELECT jsonb_build_object(
							'lesson_id', vc.lesson_id,
							'video_url', vc.video_url,
							'written_content', vc.written_content,
							'created_at', vc.created_at,
							'updated_at', vc.updated_at
						)
						FROM lesson_video_content vc
						WHERE vc.lesson_id = li.lesson_id
					)
					ELSE NULL
				END AS video_content,
				CASE 
					WHEN li.lesson_type = 'document' THEN (
						SELECT jsonb_build_object(
							'lesson_id', dc.lesson_id,
							'content', dc.content,
							'created_at', dc.created_at,
							'updated_at', dc.updated_at
						)
						FROM lesson_document_content dc
						WHERE dc.lesson_id = li.lesson_id
					)
					ELSE NULL
				END AS document_content,
				CASE 
					WHEN li.lesson_type = 'quiz' THEN (
						SELECT jsonb_build_object(
							'id', qm.id,
							'lesson_id', qm.lesson_id,
							'title', qm.title,
							'time_limit_seconds', qm.time_limit_seconds,
							'total_questions', qm.total_questions,
							'pass_score_percent', qm.pass_score_percent,
							'created_at', qm.created_at,
							'updated_at', qm.updated_at
						)
						FROM quiz_metadata qm
						WHERE qm.lesson_id = li.lesson_id
					)
					ELSE NULL
				END AS quiz_content
			FROM lesson_info li
			CROSS JOIN enrollment_auth ea
			WHERE %s
		)
		SELECT 
			EXISTS(SELECT 1 FROM lesson_info) AS lesson_exists,
			COALESCE((SELECT is_enrolled FROM enrollment_auth), false) AS is_enrolled,
			(SELECT row_to_json(content_cte.*) FROM content_cte) AS content_data;
	`, enrollmentCTE, updateCTE, contentWhere)
}

func BuildReadContentScopedQuery(scope generic.AuthScope) string {
	enrollmentCTE := `SELECT true AS is_enrolled`
	updateCTE := `SELECT NULL AS id`
	contentWhere := `1=1`

	if scope == generic.ScopeUser {
		enrollmentCTE = `
			SELECT EXISTS (
				SELECT 1 FROM enrollments e
				JOIN lesson_info li ON e.course_id = li.course_id
				WHERE e.user_id = $2 AND e.revoked = false
			) AS is_enrolled
		`
		updateCTE = `
			UPDATE enrollments e
			SET last_accessed_lesson_id = $1
			FROM lesson_info li, enrollment_auth ea
			WHERE e.course_id = li.course_id AND e.user_id = $2 AND e.revoked = false AND ea.is_enrolled = true
			RETURNING e.id
		`
		contentWhere = `ea.is_enrolled = true`
	}

	return BuildReadContentQuery(enrollmentCTE, updateCTE, contentWhere)
}
