package notes

import (
	"encoding/json"
	"errors"
)

var (
	ErrNotEnrolled    = errors.New("access denied: not enrolled in course")
	ErrLessonNotFound = errors.New("lesson not found")
	ErrNoteNotFound   = errors.New("note not found")
	ErrAccessDenied   = errors.New("access denied")
)

func (m *NotesModule) UpsertRepository(userID, lessonID, content string) (*NoteResponse, error) {
	var result struct {
		LessonExists bool             `db:"lesson_exists"`
		IsEnrolled   bool             `db:"is_enrolled"`
		InsertedData *json.RawMessage `db:"inserted_data"`
	}

	query := `
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
			INSERT INTO user_notes (user_id, lesson_id, course_id, content, updated_at)
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
			(SELECT row_to_json(inserted.*) FROM inserted) AS inserted_data
	`
	err := m.DB.Get(&result, query, userID, lessonID, content)
	if err != nil {
		return nil, err
	}

	switch {
	case !result.LessonExists:
		return nil, ErrLessonNotFound
	case !result.IsEnrolled:
		return nil, ErrNotEnrolled
	case result.InsertedData == nil:
		return nil, errors.New("failed to save note")
	}

	var n NoteResponse
	if err := json.Unmarshal(*result.InsertedData, &n); err != nil {
		return nil, err
	}
	return &n, nil
}

func (m *NotesModule) ReadRepository(userID, lessonID string) (*UserNote, error) {
	var result struct {
		LessonExists bool             `db:"lesson_exists"`
		IsEnrolled   bool             `db:"is_enrolled"`
		NoteJSON     *json.RawMessage `db:"note_json"`
	}

	query := `
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
			FROM user_notes
			WHERE user_id = $1 AND lesson_id = $2
		)
		SELECT 
			EXISTS(SELECT 1 FROM lesson_info) AS lesson_exists,
			COALESCE((SELECT is_enrolled FROM enrollment_auth), false) AS is_enrolled,
			(SELECT row_to_json(note_data.*) FROM note_data) AS note_json
	`
	err := m.DB.Get(&result, query, userID, lessonID)
	if err != nil {
		return nil, err
	}

	switch {
	case !result.LessonExists:
		return nil, ErrLessonNotFound
	case !result.IsEnrolled:
		return nil, ErrNotEnrolled
	case result.NoteJSON == nil:
		return nil, ErrNoteNotFound
	}

	var n UserNote
	if err := json.Unmarshal(*result.NoteJSON, &n); err != nil {
		return nil, err
	}
	return &n, nil
}

func (m *NotesModule) UpdateRepository(id, userID, content string) (*NoteResponse, error) {
	var result struct {
		NoteExists  bool             `db:"note_exists"`
		IsOwner     bool             `db:"is_owner"`
		IsEnrolled  bool             `db:"is_enrolled"`
		UpdatedData *json.RawMessage `db:"updated_data"`
	}

	query := `
		WITH note_info AS (
			SELECT id, user_id, lesson_id, course_id FROM user_notes WHERE id = $1
		),
		enrollment_auth AS (
			SELECT EXISTS (
				SELECT 1 FROM enrollments e
				JOIN note_info ni ON e.course_id = ni.course_id
				WHERE e.user_id = $2 AND e.revoked = false
			) AS is_enrolled
		),
		updated AS (
			UPDATE user_notes SET content = $3, updated_at = CURRENT_TIMESTAMP
			FROM note_info ni
			CROSS JOIN enrollment_auth ea
			WHERE user_notes.id = $1 AND user_notes.user_id = $2 AND ea.is_enrolled = true
			RETURNING user_notes.id, user_notes.content, user_notes.updated_at
		)
		SELECT 
			EXISTS(SELECT 1 FROM note_info) AS note_exists,
			EXISTS(SELECT 1 FROM note_info WHERE user_id = $2) AS is_owner,
			COALESCE((SELECT is_enrolled FROM enrollment_auth), false) AS is_enrolled,
			(SELECT row_to_json(updated.*) FROM updated) AS updated_data
	`
	err := m.DB.Get(&result, query, id, userID, content)
	if err != nil {
		return nil, err
	}

	switch {
	case !result.NoteExists:
		return nil, ErrNoteNotFound
	case !result.IsOwner:
		return nil, ErrAccessDenied
	case !result.IsEnrolled:
		return nil, ErrNotEnrolled
	case result.UpdatedData == nil:
		return nil, errors.New("failed to update note")
	}

	var n NoteResponse
	if err := json.Unmarshal(*result.UpdatedData, &n); err != nil {
		return nil, err
	}
	return &n, nil
}

func (m *NotesModule) DeleteRepository(id, userID string) (string, error) {
	var result struct {
		NoteExists bool    `db:"note_exists"`
		IsOwner    bool    `db:"is_owner"`
		IsEnrolled bool    `db:"is_enrolled"`
		DeletedID  *string `db:"deleted_id"`
	}

	query := `
		WITH note_info AS (
			SELECT id, user_id, lesson_id, course_id FROM user_notes WHERE id = $1
		),
		enrollment_auth AS (
			SELECT EXISTS (
				SELECT 1 FROM enrollments e
				JOIN note_info ni ON e.course_id = ni.course_id
				WHERE e.user_id = $2 AND e.revoked = false
			) AS is_enrolled
		),
		deleted AS (
			DELETE FROM user_notes
			USING note_info ni, enrollment_auth ea
			WHERE user_notes.id = $1 AND user_notes.user_id = $2 AND ea.is_enrolled = true
			RETURNING user_notes.id
		)
		SELECT 
			EXISTS(SELECT 1 FROM note_info) AS note_exists,
			EXISTS(SELECT 1 FROM note_info WHERE user_id = $2) AS is_owner,
			COALESCE((SELECT is_enrolled FROM enrollment_auth), false) AS is_enrolled,
			(SELECT id FROM deleted) AS deleted_id
	`
	err := m.DB.Get(&result, query, id, userID)
	if err != nil {
		return "", err
	}

	switch {
	case !result.NoteExists:
		return "", ErrNoteNotFound
	case !result.IsOwner:
		return "", ErrAccessDenied
	case !result.IsEnrolled:
		return "", ErrNotEnrolled
	case result.DeletedID == nil:
		return "", errors.New("failed to delete note")
	}

	return *result.DeletedID, nil
}
