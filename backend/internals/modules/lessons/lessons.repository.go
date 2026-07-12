package lessons

import (
	"encoding/json"
	"errors"
	"fmt"
	"strings"
)

var (
	ErrNotEnrolled      = errors.New("access denied: not enrolled in course")
	ErrLessonNotFound   = errors.New("lesson not found")
	ErrChapterNotFound  = errors.New("chapter not found")
	ErrResourceNotFound = errors.New("resource not found")
	ErrAccessDenied     = errors.New("access denied")
)

func (m *LessonsModule) ListRepository(chapterID, tutorID string) ([]Lesson, error) {
	var result struct {
		ChapterExists bool            `db:"chapter_exists"`
		IsOwner       bool            `db:"is_owner"`
		Data          json.RawMessage `db:"data"`
	}

	query := `
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
			COALESCE((SELECT json_agg(lessons_data) FROM lessons_data), '[]'::json) AS data
	`
	err := m.DB.Get(&result, query, chapterID, tutorID)
	if err != nil {
		return nil, err
	}

	switch {
	case !result.ChapterExists:
		return nil, ErrChapterNotFound
	case !result.IsOwner:
		return nil, ErrAccessDenied
	}

	var lessons []Lesson
	if err := json.Unmarshal(result.Data, &lessons); err != nil {
		return nil, err
	}
	return lessons, nil
}

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

func (m *LessonsModule) CreateRepository(tutorID, chapterID string, req CreateLessonRequest) (*Lesson, error) {
	var result struct {
		CourseTutorID *string          `db:"course_tutor_id"`
		CourseID      *string          `db:"course_id"`
		InsertedData  *json.RawMessage `db:"inserted_data"`
	}

	query := `
		WITH auth AS (
			SELECT c.id AS course_id, c.tutor_id
			FROM chapters ch
			JOIN courses c ON c.id = ch.course_id
			WHERE ch.id = $1
		),
		inserted AS (
			INSERT INTO lessons (chapter_id, lesson_no, title, lesson_type, short_description, preview_video_url, duration_seconds)
			SELECT $1, $2, $3, $4, $5, $6, $7
			FROM auth
			WHERE auth.tutor_id = $8
			RETURNING *
		)
		SELECT 
			(SELECT tutor_id FROM auth) AS course_tutor_id,
			(SELECT id FROM auth) AS course_id,
			row_to_json(inserted.*) AS inserted_data
		FROM (SELECT 1) dummy
		LEFT JOIN inserted ON true
	`
	err := m.DB.Get(&result, query,
		chapterID, req.LessonNo, req.Title, req.LessonType, req.ShortDescription, req.PreviewVideoURL, req.DurationSeconds,
		tutorID,
	)
	if err != nil {
		return nil, err
	}

	switch {
	case result.CourseTutorID == nil:
		return nil, ErrChapterNotFound
	case result.InsertedData == nil:
		return nil, ErrAccessDenied
	}

	var l Lesson
	if err := json.Unmarshal(*result.InsertedData, &l); err != nil {
		return nil, err
	}
	return &l, nil
}

func (m *LessonsModule) UpdateRepository(id, tutorID string, req UpdateLessonRequest) (*Lesson, error) {
	setClauses := []string{"updated_at = CURRENT_TIMESTAMP"}
	var args []interface{}
	argIdx := 1

	if req.Title != nil {
		setClauses = append(setClauses, fmt.Sprintf("title = $%d", argIdx))
		args = append(args, *req.Title)
		argIdx++
	}
	if req.LessonNo != nil {
		setClauses = append(setClauses, fmt.Sprintf("lesson_no = $%d", argIdx))
		args = append(args, *req.LessonNo)
		argIdx++
	}
	if req.ShortDescription != nil {
		setClauses = append(setClauses, fmt.Sprintf("short_description = $%d", argIdx))
		args = append(args, *req.ShortDescription)
		argIdx++
	}
	if req.PreviewVideoURL != nil {
		setClauses = append(setClauses, fmt.Sprintf("preview_video_url = $%d", argIdx))
		args = append(args, *req.PreviewVideoURL)
		argIdx++
	}
	if req.DurationSeconds != nil {
		setClauses = append(setClauses, fmt.Sprintf("duration_seconds = $%d", argIdx))
		args = append(args, *req.DurationSeconds)
		argIdx++
	}

	tutorArgIdx := argIdx
	idArgIdx := argIdx + 1
	args = append(args, tutorID, id)

	query := fmt.Sprintf(`
		WITH auth AS (
			SELECT c.tutor_id
			FROM lessons l
			JOIN chapters ch ON ch.id = l.chapter_id
			JOIN courses c ON c.id = ch.course_id
			WHERE l.id = $%d
		),
		updated AS (
			UPDATE lessons SET %s 
			WHERE id = $%d AND EXISTS(SELECT 1 FROM auth WHERE auth.tutor_id = $%d)
			RETURNING *
		)
		SELECT 
			(SELECT tutor_id FROM auth) AS course_tutor_id,
			row_to_json(updated.*) AS updated_data
		FROM (SELECT 1) dummy
		LEFT JOIN updated ON true
	`, idArgIdx, strings.Join(setClauses, ", "), idArgIdx, tutorArgIdx)

	var result struct {
		CourseTutorID *string          `db:"course_tutor_id"`
		UpdatedData   *json.RawMessage `db:"updated_data"`
	}

	err := m.DB.Get(&result, query, args...)
	if err != nil {
		return nil, err
	}

	switch {
	case result.CourseTutorID == nil:
		return nil, ErrLessonNotFound
	case result.UpdatedData == nil:
		return nil, ErrAccessDenied
	}

	var l Lesson
	if err := json.Unmarshal(*result.UpdatedData, &l); err != nil {
		return nil, err
	}
	return &l, nil
}

func (m *LessonsModule) DeleteRepository(id, tutorID string) (string, error) {
	var result struct {
		CourseTutorID *string `db:"course_tutor_id"`
		DeletedID     *string `db:"deleted_id"`
	}

	query := `
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
			(SELECT id FROM deleted) AS deleted_id
	`
	err := m.DB.Get(&result, query, id, tutorID)
	if err != nil {
		return "", err
	}

	switch {
	case result.CourseTutorID == nil:
		return "", ErrLessonNotFound
	case result.DeletedID == nil:
		return "", ErrAccessDenied
	}

	return *result.DeletedID, nil
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

// ── Resources ──

func (m *LessonsModule) CreateResourceRepository(lessonID, tutorID string, req AddResourceRequest) (*LessonResource, error) {
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
			INSERT INTO lesson_resources (lesson_id, title, file_url, file_type)
			SELECT $1, $2, $3, $4
			WHERE EXISTS(SELECT 1 FROM auth WHERE auth.tutor_id = $5)
			RETURNING id, title, file_url, file_type
		)
		SELECT 
			(SELECT tutor_id FROM auth) AS course_tutor_id,
			row_to_json(inserted.*) AS inserted_data
		FROM (SELECT 1) dummy
		LEFT JOIN inserted ON true
	`
	err := m.DB.Get(&result, query, lessonID, req.Title, req.FileURL, req.FileType, tutorID)
	if err != nil {
		return nil, err
	}

	switch {
	case result.CourseTutorID == nil:
		return nil, ErrLessonNotFound
	case result.InsertedData == nil:
		return nil, ErrAccessDenied
	}

	var res LessonResource
	if err := json.Unmarshal(*result.InsertedData, &res); err != nil {
		return nil, err
	}
	return &res, nil
}

func (m *LessonsModule) DeleteResourceRepository(resourceID, tutorID string) (string, error) {
	var result struct {
		CourseTutorID *string `db:"course_tutor_id"`
		DeletedID     *string `db:"deleted_id"`
	}

	query := `
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
			RETURNING id
		)
		SELECT 
			(SELECT tutor_id FROM auth) AS course_tutor_id,
			(SELECT id FROM deleted) AS deleted_id
	`
	err := m.DB.Get(&result, query, resourceID, tutorID)
	if err != nil {
		return "", err
	}

	switch {
	case result.CourseTutorID == nil:
		return "", ErrResourceNotFound
	case result.DeletedID == nil:
		return "", ErrAccessDenied
	}

	return *result.DeletedID, nil
}

func (m *LessonsModule) MarkLessonComplete(userID, lessonID string) error {
	var result struct {
		LessonExists bool `db:"lesson_exists"`
		IsEnrolled   bool `db:"is_enrolled"`
		Completed    bool `db:"completed"`
	}

	query := `
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
			EXISTS(SELECT 1 FROM inserted) AS completed
	`
	err := m.DB.Get(&result, query, lessonID, userID)
	if err != nil {
		return err
	}

	switch {
	case !result.LessonExists:
		return ErrLessonNotFound
	case !result.IsEnrolled:
		return ErrNotEnrolled
	}

	return nil
}
