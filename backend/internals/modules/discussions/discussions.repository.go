package discussions

import (
	"database/sql"
	"encoding/json"
	"errors"
)

var (
	ErrNotEnrolled        = errors.New("access denied: not enrolled in this course")
	ErrLessonNotFound     = errors.New("lesson not found")
	ErrDiscussionNotFound = errors.New("discussion not found")
	ErrAccessDenied       = errors.New("access denied")
)

func (m *DiscussionsModule) ListByLessonRepository(lessonID, userID string, page, limit int) ([]Discussion, int, error) {
	offset := (page - 1) * limit

	var result struct {
		LessonExists bool            `db:"lesson_exists"`
		Authorized   bool            `db:"authorized"`
		Total        int             `db:"total"`
		Data         json.RawMessage `db:"data"`
	}
	err := m.DB.Get(&result, `
		WITH lesson_info AS (
			SELECT c.course_id 
			FROM lessons l
			JOIN chapters c ON c.id = l.chapter_id
			WHERE l.id = $1
		),
		course_auth AS (
			SELECT li.course_id,
				   EXISTS(SELECT 1 FROM enrollments WHERE user_id = $2 AND course_id = li.course_id AND revoked = false) AS is_enrolled,
				   EXISTS(SELECT 1 FROM courses WHERE id = li.course_id AND tutor_id = $2) AS is_owner
			FROM lesson_info li
		),
		count_cte AS (
			SELECT COUNT(*) AS total FROM discussions WHERE lesson_id = $1 AND parent_id IS NULL
		),
		data_cte AS (
			SELECT d.id, d.lesson_id, d.course_id, d.parent_id, d.content, d.depth, d.reply_count, d.created_at, d.updated_at,
				   json_build_object('id', u.id, 'name', COALESCE(u.name, ''), 'image', COALESCE(u.image, '')) AS user
			FROM discussions d
			JOIN "user" u ON u.id = d.user_id
			WHERE d.lesson_id = $1 AND d.parent_id IS NULL
			ORDER BY d.created_at DESC
			LIMIT $3 OFFSET $4
		)
		SELECT 
			EXISTS(SELECT 1 FROM lesson_info) AS lesson_exists,
			COALESCE((SELECT is_enrolled OR is_owner FROM course_auth), false) AS authorized,
			COALESCE((SELECT total FROM count_cte), 0) AS total,
			COALESCE((SELECT json_agg(data_cte) FROM data_cte), '[]'::json) AS data
	`, lessonID, userID, limit, offset)
	if err != nil {
		return nil, 0, err
	}

	switch {
	case !result.LessonExists:
		return nil, 0, ErrLessonNotFound
	case !result.Authorized:
		return nil, 0, ErrNotEnrolled
	}

	var discussions []Discussion
	if err := json.Unmarshal(result.Data, &discussions); err != nil {
		return nil, 0, err
	}
	return discussions, result.Total, nil
}

func (m *DiscussionsModule) ListByLessonAdminRepository(lessonID string, page, limit int) ([]Discussion, int, error) {
	offset := (page - 1) * limit

	var result struct {
		Total int             `db:"total"`
		Data  json.RawMessage `db:"data"`
	}
	err := m.DB.Get(&result, `
		WITH count_cte AS (
			SELECT COUNT(*) AS total FROM discussions WHERE lesson_id = $1 AND parent_id IS NULL
		),
		data_cte AS (
			SELECT d.id, d.lesson_id, d.course_id, d.parent_id, d.content, d.depth, d.reply_count, d.created_at, d.updated_at,
				   json_build_object('id', u.id, 'name', COALESCE(u.name, ''), 'image', COALESCE(u.image, '')) AS user
			FROM discussions d
			JOIN "user" u ON u.id = d.user_id
			WHERE d.lesson_id = $1 AND d.parent_id IS NULL
			ORDER BY d.created_at DESC
			LIMIT $2 OFFSET $3
		)
		SELECT 
			COALESCE((SELECT total FROM count_cte), 0) AS total,
			COALESCE((SELECT json_agg(data_cte) FROM data_cte), '[]'::json) AS data
	`, lessonID, limit, offset)
	if err != nil {
		return nil, 0, err
	}

	var discussions []Discussion
	if err := json.Unmarshal(result.Data, &discussions); err != nil {
		return nil, 0, err
	}
	return discussions, result.Total, nil
}

func (m *DiscussionsModule) ListRepliesRepository(parentID, userID string, page, limit int) ([]Discussion, int, error) {
	offset := (page - 1) * limit

	var result struct {
		ParentExists bool            `db:"parent_exists"`
		Authorized   bool            `db:"authorized"`
		Total        int             `db:"total"`
		Data         json.RawMessage `db:"data"`
	}
	err := m.DB.Get(&result, `
		WITH parent_info AS (
			SELECT course_id FROM discussions WHERE id = $1
		),
		course_auth AS (
			SELECT pi.course_id,
				   EXISTS(SELECT 1 FROM enrollments WHERE user_id = $2 AND course_id = pi.course_id AND revoked = false) AS is_enrolled,
				   EXISTS(SELECT 1 FROM courses WHERE id = pi.course_id AND tutor_id = $2) AS is_owner
			FROM parent_info pi
		),
		count_cte AS (
			SELECT COUNT(*) AS total FROM discussions WHERE parent_id = $1
		),
		data_cte AS (
			SELECT d.id, d.lesson_id, d.course_id, d.parent_id, d.content, d.depth, d.reply_count, d.created_at, d.updated_at,
				   json_build_object('id', u.id, 'name', COALESCE(u.name, ''), 'image', COALESCE(u.image, '')) AS user
			FROM discussions d
			JOIN "user" u ON u.id = d.user_id
			WHERE d.parent_id = $1
			ORDER BY d.created_at ASC
			LIMIT $3 OFFSET $4
		)
		SELECT 
			EXISTS(SELECT 1 FROM parent_info) AS parent_exists,
			COALESCE((SELECT is_enrolled OR is_owner FROM course_auth), false) AS authorized,
			COALESCE((SELECT total FROM count_cte), 0) AS total,
			COALESCE((SELECT json_agg(data_cte) FROM data_cte), '[]'::json) AS data
	`, parentID, userID, limit, offset)
	if err != nil {
		return nil, 0, err
	}

	switch {
	case !result.ParentExists:
		return nil, 0, ErrDiscussionNotFound
	case !result.Authorized:
		return nil, 0, ErrNotEnrolled
	}

	var discussions []Discussion
	if err := json.Unmarshal(result.Data, &discussions); err != nil {
		return nil, 0, err
	}
	return discussions, result.Total, nil
}

func (m *DiscussionsModule) CreateRepository(userID, lessonID string, req CreateDiscussionRequest) (*Discussion, error) {
	var result struct {
		CourseID     *string          `db:"course_id"`
		Authorized   *bool            `db:"authorized"`
		InsertedData *json.RawMessage `db:"inserted_data"`
	}
	err := m.DB.Get(&result, `
		WITH lesson_info AS (
			SELECT c.course_id 
			FROM lessons l
			JOIN chapters c ON c.id = l.chapter_id
			WHERE l.id = $1
		),
		course_auth AS (
			SELECT li.course_id,
				   EXISTS(SELECT 1 FROM enrollments WHERE user_id = $2 AND course_id = li.course_id AND revoked = false) AS is_enrolled,
				   EXISTS(SELECT 1 FROM courses WHERE id = li.course_id AND tutor_id = $2) AS is_owner
			FROM lesson_info li
		),
		inserted AS (
			INSERT INTO discussions (lesson_id, course_id, user_id, parent_id, content, depth)
			SELECT $1, ca.course_id, $2, $3, $4, COALESCE((SELECT depth + 1 FROM discussions WHERE id = $3), 0)
			FROM course_auth ca
			WHERE ca.is_enrolled = true OR ca.is_owner = true
			RETURNING *
		),
		formatted AS (
			SELECT i.id, i.lesson_id, i.course_id, i.parent_id, i.content, i.depth, i.reply_count, i.created_at, i.updated_at,
				   json_build_object('id', u.id, 'name', COALESCE(u.name, ''), 'image', COALESCE(u.image, '')) AS user
			FROM inserted i
			JOIN "user" u ON u.id = i.user_id
		)
		SELECT 
			(SELECT course_id FROM lesson_info) AS course_id,
			(SELECT is_enrolled OR is_owner FROM course_auth) AS authorized,
			(SELECT row_to_json(formatted.*) FROM formatted) AS inserted_data
	`, lessonID, userID, req.ParentID, req.Content)

	if err != nil {
		return nil, err
	}

	switch {
	case result.CourseID == nil:
		return nil, ErrLessonNotFound
	case result.Authorized == nil || !*result.Authorized:
		return nil, ErrNotEnrolled
	case result.InsertedData == nil:
		return nil, errors.New("failed to insert discussion")
	}

	var d Discussion
	if err := json.Unmarshal(*result.InsertedData, &d); err != nil {
		return nil, err
	}
	return &d, nil
}

func (m *DiscussionsModule) UpdateRepository(id, userID string, content string) (*Discussion, error) {
	var result struct {
		DiscussionExists bool             `db:"discussion_exists"`
		IsOwnerUser      bool             `db:"is_owner_user"`
		Authorized       bool             `db:"authorized"`
		UpdatedData      *json.RawMessage `db:"updated_data"`
	}

	query := `
		WITH note_info AS (
			SELECT course_id FROM discussions WHERE id = $2 AND user_id = $3
		),
		course_auth AS (
			SELECT ni.course_id,
				   EXISTS(SELECT 1 FROM enrollments WHERE user_id = $3 AND course_id = ni.course_id AND revoked = false) AS is_enrolled,
				   EXISTS(SELECT 1 FROM courses WHERE id = ni.course_id AND tutor_id = $3) AS is_owner
			FROM note_info ni
		),
		updated AS (
			UPDATE discussions SET content = $1, updated_at = CURRENT_TIMESTAMP
			FROM note_info ni
			CROSS JOIN course_auth ca
			WHERE discussions.id = $2 AND discussions.user_id = $3 AND (ca.is_enrolled = true OR ca.is_owner = true)
			RETURNING discussions.*
		)
		SELECT 
			EXISTS(SELECT 1 FROM discussions WHERE id = $2) AS discussion_exists,
			EXISTS(SELECT 1 FROM discussions WHERE id = $2 AND user_id = $3) AS is_owner_user,
			COALESCE((SELECT is_enrolled OR is_owner FROM course_auth), false) AS authorized,
			(
				SELECT row_to_json(formatted.*) FROM (
					SELECT u.id, u.lesson_id, u.course_id, u.parent_id, u.content, u.depth, u.reply_count, u.created_at, u.updated_at,
						   json_build_object('id', usr.id, 'name', COALESCE(usr.name, ''), 'image', COALESCE(usr.image, '')) AS user
					FROM updated u
					JOIN "user" usr ON usr.id = u.user_id
				) formatted
			) AS updated_data
	`
	err := m.DB.Get(&result, query, content, id, userID)
	if err != nil {
		return nil, err
	}

	switch {
	case !result.DiscussionExists:
		return nil, ErrDiscussionNotFound
	case !result.IsOwnerUser:
		return nil, ErrAccessDenied
	case !result.Authorized:
		return nil, ErrNotEnrolled
	case result.UpdatedData == nil:
		return nil, errors.New("failed to update discussion")
	}

	var d Discussion
	if err := json.Unmarshal(*result.UpdatedData, &d); err != nil {
		return nil, err
	}
	return &d, nil
}

func (m *DiscussionsModule) DeleteRepository(id, userID string) (string, error) {
	var result struct {
		DiscussionExists bool    `db:"discussion_exists"`
		IsOwnerUser      bool    `db:"is_owner_user"`
		Authorized       bool    `db:"authorized"`
		DeletedID        *string `db:"deleted_id"`
	}

	query := `
		WITH discussion_info AS (
			SELECT course_id, user_id FROM discussions WHERE id = $1
		),
		course_auth AS (
			SELECT di.course_id,
				   EXISTS(SELECT 1 FROM enrollments WHERE user_id = $2 AND course_id = di.course_id AND revoked = false) AS is_enrolled,
				   EXISTS(SELECT 1 FROM courses WHERE id = di.course_id AND tutor_id = $2) AS is_owner
			FROM discussion_info di
		),
		deleted AS (
			DELETE FROM discussions d
			USING discussion_info di, course_auth ca
			WHERE d.id = $1 AND d.user_id = $2 AND (ca.is_enrolled = true OR ca.is_owner = true)
			RETURNING d.id
		)
		SELECT 
			EXISTS(SELECT 1 FROM discussion_info) AS discussion_exists,
			EXISTS(SELECT 1 FROM discussion_info WHERE user_id = $2) AS is_owner_user,
			COALESCE((SELECT is_enrolled OR is_owner FROM course_auth), false) AS authorized,
			(SELECT id FROM deleted) AS deleted_id
	`
	err := m.DB.Get(&result, query, id, userID)
	if err != nil {
		return "", err
	}

	switch {
	case !result.DiscussionExists:
		return "", ErrDiscussionNotFound
	case !result.IsOwnerUser:
		return "", ErrAccessDenied
	case !result.Authorized:
		return "", ErrNotEnrolled
	case result.DeletedID == nil:
		return "", errors.New("failed to delete discussion")
	}

	return *result.DeletedID, nil
}

func (m *DiscussionsModule) TutorDeleteRepository(id, tutorID string) (string, error) {
	var result struct {
		DiscussionExists bool    `db:"discussion_exists"`
		IsCourseTutor    bool    `db:"is_course_tutor"`
		DeletedID        *string `db:"deleted_id"`
	}

	query := `
		WITH discussion_info AS (
			SELECT d.id, d.course_id, c.tutor_id
			FROM discussions d
			JOIN courses c ON c.id = d.course_id
			WHERE d.id = $1
		),
		deleted AS (
			DELETE FROM discussions d
			USING discussion_info di
			WHERE d.id = $1 AND di.tutor_id = $2
			RETURNING d.id
		)
		SELECT 
			EXISTS(SELECT 1 FROM discussion_info) AS discussion_exists,
			EXISTS(SELECT 1 FROM discussion_info WHERE tutor_id = $2) AS is_course_tutor,
			(SELECT id FROM deleted) AS deleted_id
	`
	err := m.DB.Get(&result, query, id, tutorID)
	if err != nil {
		return "", err
	}

	switch {
	case !result.DiscussionExists:
		return "", ErrDiscussionNotFound
	case !result.IsCourseTutor:
		return "", ErrAccessDenied
	case result.DeletedID == nil:
		return "", errors.New("failed to delete discussion")
	}

	return *result.DeletedID, nil
}

func (m *DiscussionsModule) AdminDeleteRepository(id string) (string, error) {
	var deletedID string
	err := m.DB.Get(&deletedID, `DELETE FROM discussions WHERE id = $1 RETURNING id`, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return "", ErrDiscussionNotFound
		}
		return "", err
	}
	return deletedID, nil
}
