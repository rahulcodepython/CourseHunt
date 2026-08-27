package repositories

import (
	"coursehunt/server/internals/entities"
	"coursehunt/server/internals/generic"
	"encoding/json"
	"errors"
)

func (r *LessonsRepository) ReadContentRepository(lessonID, userID string, scope generic.AuthScope) (*entities.AggregatedLessonContentResponse, error) {
	var result struct {
		LessonExists bool             `db:"lesson_exists"`
		IsEnrolled   bool             `db:"is_enrolled"`
		ContentData  *json.RawMessage `db:"content_data"`
	}

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

	query := `
		WITH lesson_info AS (
			SELECT l.id AS lesson_id, l.lesson_type, ch.course_id
			FROM lessons l
			JOIN chapters ch ON ch.id = l.chapter_id
			WHERE l.id = $1
		),
		enrollment_auth AS (` + enrollmentCTE + `),
		updated_enrollment AS (` + updateCTE + `),
		content_cte AS (
			SELECT 
				li.lesson_type,
				CASE 
					WHEN li.lesson_type = 'video' THEN (
						SELECT json_build_object(
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
						SELECT json_build_object(
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
						SELECT json_build_object(
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
			WHERE ` + contentWhere + `
		)
		SELECT 
			EXISTS(SELECT 1 FROM lesson_info) AS lesson_exists,
			COALESCE((SELECT is_enrolled FROM enrollment_auth), false) AS is_enrolled,
			(SELECT row_to_json(content_cte.*) FROM content_cte) AS content_data
	`
	// The elevated (non-ScopeUser) branches above never reference $2 in the
	// query text — passing userID unconditionally makes Postgres reject the
	// call ("got 2 parameters but the statement requires 1"), so only bind
	// it when the query actually uses it.
	args := []any{lessonID}
	if scope == generic.ScopeUser {
		args = append(args, userID)
	}
	err := r.DB.Get(&result, query, args...)
	if err != nil {
		return nil, err
	}

	switch {
	case !result.LessonExists:
		return nil, generic.ErrLessonsLessonNotFound
	case !result.IsEnrolled:
		return nil, generic.ErrLessonsNotEnrolled
	case result.ContentData == nil:
		return nil, errors.New("failed to retrieve content")
	}

	var resp entities.AggregatedLessonContentResponse
	if err := json.Unmarshal(*result.ContentData, &resp); err != nil {
		return nil, err
	}
	return &resp, nil
}

// ReadContentForTutorRepository is the tutor-authoring counterpart to
// ReadContentRepository: gated by course ownership instead of enrollment, so
// a tutor can see their own lesson's content while editing it (they're never
// "enrolled" in their own course).
func (r *LessonsRepository) ReadContentForTutorRepository(lessonID, tutorID string) (*entities.AggregatedLessonContentResponse, error) {
	var result struct {
		LessonExists bool             `db:"lesson_exists"`
		IsOwner      bool             `db:"is_owner"`
		ContentData  *json.RawMessage `db:"content_data"`
	}

	query := `
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
						SELECT json_build_object(
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
						SELECT json_build_object(
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
						SELECT json_build_object(
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
			(SELECT row_to_json(content_cte.*) FROM content_cte) AS content_data
	`
	err := r.DB.Get(&result, query, lessonID, tutorID)
	if err != nil {
		return nil, err
	}

	switch {
	case !result.LessonExists:
		return nil, generic.ErrLessonsLessonNotFound
	case !result.IsOwner:
		return nil, generic.ErrLessonsAccessDenied
	case result.ContentData == nil:
		return nil, errors.New("failed to retrieve content")
	}

	var resp entities.AggregatedLessonContentResponse
	if err := json.Unmarshal(*result.ContentData, &resp); err != nil {
		return nil, err
	}
	return &resp, nil
}

// ── Video Content ──

func (r *LessonsRepository) UpsertVideoContentRepository(lessonID, tutorID string, req entities.UpsertVideoContentRequest) (*entities.LessonVideoContent, *entities.LessonFileCleanup, error) {
	var result struct {
		CourseTutorID *string          `db:"course_tutor_id"`
		OldVideoURL   *string          `db:"old_video_url"`
		InsertedData  *json.RawMessage `db:"inserted_data"`
	}

	// before captures the pre-upsert video_url (if any row already existed)
	// so the controller can delete the superseded S3 object on replace.
	query := `
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
		LEFT JOIN inserted ON true
	`
	err := r.DB.Get(&result, query, lessonID, req.VideoURL, req.WrittenContent, tutorID)
	if err != nil {
		return nil, nil, err
	}

	switch {
	case result.CourseTutorID == nil:
		return nil, nil, generic.ErrLessonsLessonNotFound
	case result.InsertedData == nil:
		return nil, nil, generic.ErrLessonsAccessDenied
	}

	var vc entities.LessonVideoContent
	if err := json.Unmarshal(*result.InsertedData, &vc); err != nil {
		return nil, nil, err
	}
	cleanup := &entities.LessonFileCleanup{OldVideoURL: result.OldVideoURL}
	return &vc, cleanup, nil
}

// ── Document Content ──

func (r *LessonsRepository) UpsertDocumentContentRepository(lessonID, tutorID, content string) (*entities.LessonDocumentContent, error) {
	var result struct {
		CourseTutorID *string          `db:"course_tutor_id"`
		InsertedData  *json.RawMessage `db:"inserted_data"`
	}

	query := `
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
		LEFT JOIN inserted ON true
	`
	err := r.DB.Get(&result, query, lessonID, content, tutorID)
	if err != nil {
		return nil, err
	}

	switch {
	case result.CourseTutorID == nil:
		return nil, generic.ErrLessonsLessonNotFound
	case result.InsertedData == nil:
		return nil, generic.ErrLessonsAccessDenied
	}

	var dc entities.LessonDocumentContent
	if err := json.Unmarshal(*result.InsertedData, &dc); err != nil {
		return nil, err
	}
	return &dc, nil
}
