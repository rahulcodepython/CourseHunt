package lessons

import (
	"encoding/json"
	"errors"
)

func (m *LessonsModule) ReadContentAggregatedRepository(lessonID, userID string) (*AggregatedLessonContentResponse, error) {
	var result struct {
		LessonExists bool             `db:"lesson_exists"`
		IsEnrolled   bool             `db:"is_enrolled"`
		ContentData  *json.RawMessage `db:"content_data"`
	}

	query := `
		WITH lesson_info AS (
			SELECT l.id AS lesson_id, l.lesson_type, ch.course_id
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
		updated_enrollment AS (
			UPDATE enrollments e
			SET last_accessed_lesson_id = $1
			FROM lesson_info li, enrollment_auth ea
			WHERE e.course_id = li.course_id AND e.user_id = $2 AND e.revoked = false AND ea.is_enrolled = true
			RETURNING e.id
		),
		content_cte AS (
			SELECT 
				li.lesson_type,
				CASE 
					WHEN li.lesson_type = 'video' THEN (
						SELECT json_build_object(
							'id', vc.id,
							'video_url', vc.video_url,
							'written_content', vc.written_content
						)
						FROM lesson_video_content vc
						WHERE vc.lesson_id = li.lesson_id
					)
					ELSE NULL
				END AS video_content,
				CASE 
					WHEN li.lesson_type = 'document' THEN (
						SELECT json_build_object(
							'id', dc.id,
							'content', dc.content
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
							'pass_score_percent', qm.pass_score_percent
						)
						FROM quiz_metadata qm
						WHERE qm.lesson_id = li.lesson_id
					)
					ELSE NULL
				END AS quiz_content
			FROM lesson_info li
			CROSS JOIN enrollment_auth ea
			WHERE ea.is_enrolled = true
		)
		SELECT 
			EXISTS(SELECT 1 FROM lesson_info) AS lesson_exists,
			COALESCE((SELECT is_enrolled FROM enrollment_auth), false) AS is_enrolled,
			(SELECT row_to_json(content_cte.*) FROM content_cte) AS content_data
	`
	err := m.DB.Get(&result, query, lessonID, userID)
	if err != nil {
		return nil, err
	}

	switch {
	case !result.LessonExists:
		return nil, ErrLessonNotFound
	case !result.IsEnrolled:
		return nil, ErrNotEnrolled
	case result.ContentData == nil:
		return nil, errors.New("failed to retrieve content")
	}

	var resp AggregatedLessonContentResponse
	if err := json.Unmarshal(*result.ContentData, &resp); err != nil {
		return nil, err
	}
	return &resp, nil
}

// ── Video Content ──

func (m *LessonsModule) UpsertVideoContentRepository(lessonID, tutorID string, req UpsertVideoContentRequest) (*LessonVideoContent, error) {
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
			INSERT INTO lesson_video_content (lesson_id, video_url, written_content)
			SELECT $1, $2, $3
			WHERE EXISTS(SELECT 1 FROM auth WHERE auth.tutor_id = $4)
			ON CONFLICT (lesson_id) DO UPDATE SET video_url = $2, written_content = $3
			RETURNING id, video_url, written_content
		)
		SELECT 
			(SELECT tutor_id FROM auth) AS course_tutor_id,
			row_to_json(inserted.*) AS inserted_data
		FROM (SELECT 1) dummy
		LEFT JOIN inserted ON true
	`
	err := m.DB.Get(&result, query, lessonID, req.VideoURL, req.WrittenContent, tutorID)
	if err != nil {
		return nil, err
	}

	switch {
	case result.CourseTutorID == nil:
		return nil, ErrLessonNotFound
	case result.InsertedData == nil:
		return nil, ErrAccessDenied
	}

	var vc LessonVideoContent
	if err := json.Unmarshal(*result.InsertedData, &vc); err != nil {
		return nil, err
	}
	return &vc, nil
}

// ── Document Content ──

func (m *LessonsModule) UpsertDocumentContentRepository(lessonID, tutorID, content string) (*LessonDocumentContent, error) {
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
			INSERT INTO lesson_document_content (lesson_id, content)
			SELECT $1, $2
			WHERE EXISTS(SELECT 1 FROM auth WHERE auth.tutor_id = $3)
			ON CONFLICT (lesson_id) DO UPDATE SET content = $2
			RETURNING id, content
		)
		SELECT 
			(SELECT tutor_id FROM auth) AS course_tutor_id,
			row_to_json(inserted.*) AS inserted_data
		FROM (SELECT 1) dummy
		LEFT JOIN inserted ON true
	`
	err := m.DB.Get(&result, query, lessonID, content, tutorID)
	if err != nil {
		return nil, err
	}

	switch {
	case result.CourseTutorID == nil:
		return nil, ErrLessonNotFound
	case result.InsertedData == nil:
		return nil, ErrAccessDenied
	}

	var dc LessonDocumentContent
	if err := json.Unmarshal(*result.InsertedData, &dc); err != nil {
		return nil, err
	}
	return &dc, nil
}

func (m *LessonsModule) InspectContentRepository(lessonID string) (*AggregatedLessonContentResponse, error) {
	var result struct {
		LessonExists bool             `db:"lesson_exists"`
		ContentData  *json.RawMessage `db:"content_data"`
	}

	query := `
		WITH lesson_info AS (
			SELECT l.id AS lesson_id, l.lesson_type
			FROM lessons l
			WHERE l.id = $1
		),
		content_cte AS (
			SELECT 
				li.lesson_type,
				CASE 
					WHEN li.lesson_type = 'video' THEN (
						SELECT json_build_object(
							'id', vc.id,
							'video_url', vc.video_url,
							'written_content', vc.written_content
						)
						FROM lesson_video_content vc
						WHERE vc.lesson_id = li.lesson_id
					)
					ELSE NULL
				END AS video_content,
				CASE 
					WHEN li.lesson_type = 'document' THEN (
						SELECT json_build_object(
							'id', dc.id,
							'content', dc.content
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
							'pass_score_percent', qm.pass_score_percent
						)
						FROM quiz_metadata qm
						WHERE qm.lesson_id = li.lesson_id
					)
					ELSE NULL
				END AS quiz_content
			FROM lesson_info li
		)
		SELECT 
			EXISTS(SELECT 1 FROM lesson_info) AS lesson_exists,
			(SELECT row_to_json(content_cte.*) FROM content_cte) AS content_data
	`
	err := m.DB.Get(&result, query, lessonID)
	if err != nil {
		return nil, err
	}

	switch {
	case !result.LessonExists:
		return nil, ErrLessonNotFound
	case result.ContentData == nil:
		return nil, errors.New("failed to retrieve content")
	}

	var resp AggregatedLessonContentResponse
	if err := json.Unmarshal(*result.ContentData, &resp); err != nil {
		return nil, err
	}
	return &resp, nil
}
