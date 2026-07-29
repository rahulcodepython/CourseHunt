package lessons

import (
	"encoding/json"
	"errors"

	"coursehunt/api/internals/generic"
)

var (
	ErrNotEnrolled      = errors.New("access denied: not enrolled in course")
	ErrLessonNotFound   = errors.New("lesson not found")
	ErrChapterNotFound  = errors.New("chapter not found")
	ErrResourceNotFound = errors.New("resource not found")
	ErrAccessDenied     = errors.New("access denied")
)

func (m *LessonsModule) ListRepository(chapterID, userID string, scope generic.AuthScope) ([]Lesson, error) {
	if scope == generic.ScopeAdmin {
		var lessons []Lesson
		err := m.DB.Select(&lessons, `
			SELECT id, chapter_id, lesson_no, title, lesson_type, short_description, preview_video_url, duration_seconds, created_at, updated_at
			FROM lessons
			WHERE chapter_id = $1
			ORDER BY lesson_no ASC
		`, chapterID)
		if err != nil {
			return nil, err
		}
		if lessons == nil {
			lessons = []Lesson{}
		}
		return lessons, nil
	}

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
	err := m.DB.Get(&result, query, chapterID, userID)
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
	args := map[string]interface{}{
		"id":                id,
		"user_id":           tutorID,
		"title":             req.Title,
		"lesson_no":         req.LessonNo,
		"short_description": req.ShortDescription,
		"preview_video_url": req.PreviewVideoURL,
		"duration_seconds":  req.DurationSeconds,
	}

	query := `
		WITH auth AS (
			SELECT c.tutor_id
			FROM lessons l
			JOIN chapters ch ON ch.id = l.chapter_id
			JOIN courses c ON c.id = ch.course_id
			WHERE l.id = :id
		),
		updated AS (
			UPDATE lessons SET
				title = COALESCE(:title, title),
				lesson_no = COALESCE(:lesson_no, lesson_no),
				short_description = COALESCE(:short_description, short_description),
				preview_video_url = COALESCE(:preview_video_url, preview_video_url),
				duration_seconds = COALESCE(:duration_seconds, duration_seconds),
				updated_at = CURRENT_TIMESTAMP
			WHERE id = :id AND EXISTS(SELECT 1 FROM auth WHERE auth.tutor_id = :user_id)
			RETURNING *
		)
		SELECT 
			(SELECT tutor_id FROM auth) AS course_tutor_id,
			row_to_json(updated.*) AS updated_data
		FROM (SELECT 1) dummy
		LEFT JOIN updated ON true
	`

	stmt, err := m.DB.PrepareNamed(query)
	if err != nil {
		return nil, err
	}
	defer stmt.Close()

	var result struct {
		CourseTutorID *string          `db:"course_tutor_id"`
		UpdatedData   *json.RawMessage `db:"updated_data"`
	}

	if err := stmt.Get(&result, args); err != nil {
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


