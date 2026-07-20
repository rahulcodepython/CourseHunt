package discussions

import (
	"encoding/json"
	"errors"
)

func (m *DiscussionsModule) StudentListRepository(lessonID, parentID, userID string, page, limit int) ([]Discussion, int, error) {
	if lessonID == "" && parentID == "" {
		return nil, 0, ErrMissingTarget
	}
	offset := (page - 1) * limit

	var result struct {
		TargetExists bool            `db:"target_exists"`
		IsAuthorized bool            `db:"is_authorized"`
		Total        int             `db:"total"`
		Data         json.RawMessage `db:"data"`
	}

	query := `
		WITH target_info AS (
			SELECT l.id AS target_id, ch.course_id
			FROM lessons l
			JOIN chapters ch ON ch.id = l.chapter_id
			WHERE l.id = $1 AND $1 != ''
			UNION ALL
			SELECT d.id AS target_id, d.course_id
			FROM discussions d
			WHERE d.id = $2 AND $2 != ''
		),
		auth AS (
			SELECT EXISTS (
				SELECT 1 FROM enrollments e
				JOIN target_info ti ON e.course_id = ti.course_id
				WHERE e.user_id = $3 AND e.revoked = false
			) AS is_authorized
		),
		count_cte AS (
			SELECT COUNT(*) AS total
			FROM discussions d
			CROSS JOIN auth a
			WHERE 
				(($1 != '' AND d.lesson_id = $1 AND d.parent_id IS NULL) OR
				($2 != '' AND d.parent_id = $2))
				AND a.is_authorized = true
		),
		data_cte AS (
			SELECT d.id, d.lesson_id, d.course_id, d.parent_id, d.content, d.reply_count, d.created_at, d.updated_at,
			       json_build_object('id', u.id, 'name', COALESCE(u.name, ''), 'image', COALESCE(u.image, '')) AS "user"
			FROM discussions d
			JOIN "user" u ON u.id = d.user_id
			CROSS JOIN auth a
			WHERE 
				(($1 != '' AND d.lesson_id = $1 AND d.parent_id IS NULL) OR
				($2 != '' AND d.parent_id = $2))
				AND a.is_authorized = true
			ORDER BY 
				CASE WHEN $1 != '' THEN d.created_at END DESC,
				CASE WHEN $2 != '' THEN d.created_at END ASC
			LIMIT $4 OFFSET $5
		)
		SELECT
			EXISTS(SELECT 1 FROM target_info) AS target_exists,
			COALESCE((SELECT is_authorized FROM auth), false) AS is_authorized,
			COALESCE((SELECT total FROM count_cte), 0) AS total,
			COALESCE((SELECT json_agg(data_cte) FROM data_cte), '[]'::json) AS data
	`

	err := m.DB.Get(&result, query, lessonID, parentID, userID, limit, offset)
	if err != nil {
		return nil, 0, err
	}

	switch {
	case !result.TargetExists:
		return nil, 0, ErrTargetNotFound
	case !result.IsAuthorized:
		return nil, 0, ErrNotEnrolled
	}

	var list []Discussion
	if err := json.Unmarshal(result.Data, &list); err != nil {
		return nil, 0, err
	}

	return list, result.Total, nil
}

func (m *DiscussionsModule) StudentCreateRepository(userID string, req CreateDiscussionRequest) (*Discussion, error) {
	var result struct {
		LessonExists bool             `db:"lesson_exists"`
		IsAuthorized bool             `db:"is_authorized"`
		ParentExists bool             `db:"parent_exists"`
		ParentValid  bool             `db:"parent_valid"`
		InsertedData *json.RawMessage `db:"inserted_data"`
	}

	query := `
		WITH lesson_info AS (
			SELECT l.id AS lesson_id, ch.course_id
			FROM lessons l
			JOIN chapters ch ON ch.id = l.chapter_id
			WHERE l.id = $1
		),
		parent_info AS (
			SELECT id, lesson_id FROM discussions WHERE id = $2
		),
		auth AS (
			SELECT EXISTS (
				SELECT 1 FROM enrollments e
				JOIN lesson_info li ON e.course_id = li.course_id
				WHERE e.user_id = $3 AND e.revoked = false
			) AS is_authorized
		),
		parent_validation AS (
			SELECT 
				CASE 
					WHEN $2::text IS NULL THEN true
					ELSE EXISTS(SELECT 1 FROM parent_info WHERE lesson_id = $1)
				END AS is_valid
		),
		inserted AS (
			INSERT INTO discussions (lesson_id, course_id, user_id, parent_id, content)
			SELECT $1, li.course_id, $3, $2, $4
			FROM lesson_info li
			CROSS JOIN auth a
			CROSS JOIN parent_validation pv
			WHERE a.is_authorized = true AND pv.is_valid = true
			RETURNING id, lesson_id, course_id, parent_id, content, reply_count, created_at, updated_at, user_id
		),
		inserted_with_user AS (
			SELECT i.id, i.lesson_id, i.course_id, i.parent_id, i.content, i.reply_count, i.created_at, i.updated_at,
			       json_build_object('id', u.id, 'name', COALESCE(u.name, ''), 'image', COALESCE(u.image, '')) AS "user"
			FROM inserted i
			JOIN "user" u ON u.id = i.user_id
		)
		SELECT
			EXISTS(SELECT 1 FROM lesson_info) AS lesson_exists,
			COALESCE((SELECT is_authorized FROM auth), false) AS is_authorized,
			CASE 
				WHEN $2::text IS NULL THEN true
				ELSE EXISTS(SELECT 1 FROM parent_info)
			END AS parent_exists,
			COALESCE((SELECT is_valid FROM parent_validation), false) AS parent_valid,
			(SELECT row_to_json(inserted_with_user.*) FROM inserted_with_user) AS inserted_data
	`

	err := m.DB.Get(&result, query, req.LessonID, req.ParentID, userID, req.Content)
	if err != nil {
		return nil, err
	}

	switch {
	case !result.LessonExists:
		return nil, ErrLessonNotFound
	case !result.IsAuthorized:
		return nil, ErrNotEnrolled
	case !result.ParentExists:
		return nil, ErrParentNotFound
	case !result.ParentValid:
		return nil, ErrParentInvalid
	case result.InsertedData == nil:
		return nil, errors.New("failed to post discussion")
	}

	var d Discussion
	if err := json.Unmarshal(*result.InsertedData, &d); err != nil {
		return nil, err
	}
	return &d, nil
}

func (m *DiscussionsModule) StudentUpdateRepository(id, userID string, content string) (*Discussion, error) {
	var result struct {
		DiscussionExists bool             `db:"discussion_exists"`
		IsOwner          bool             `db:"is_owner"`
		IsAuthorized     bool             `db:"is_authorized"`
		UpdatedData      *json.RawMessage `db:"updated_data"`
	}

	query := `
		WITH discussion_info AS (
			SELECT id, user_id, course_id FROM discussions WHERE id = $1
		),
		auth AS (
			SELECT EXISTS (
				SELECT 1 FROM enrollments e
				JOIN discussion_info di ON e.course_id = di.course_id
				WHERE e.user_id = $2 AND e.revoked = false
			) AS is_authorized
		),
		updated AS (
			UPDATE discussions
			SET content = $3, updated_at = CURRENT_TIMESTAMP
			FROM discussion_info di
			CROSS JOIN auth a
			WHERE discussions.id = $1 AND discussions.user_id = $2 AND a.is_authorized = true
			RETURNING discussions.id, discussions.lesson_id, discussions.course_id, discussions.parent_id, discussions.content, discussions.reply_count, discussions.created_at, discussions.updated_at, discussions.user_id
		),
		updated_with_user AS (
			SELECT u.id, u.lesson_id, u.course_id, u.parent_id, u.content, u.reply_count, u.created_at, u.updated_at,
			       json_build_object('id', usr.id, 'name', COALESCE(usr.name, ''), 'image', COALESCE(usr.image, '')) AS "user"
			FROM updated u
			JOIN "user" usr ON usr.id = u.user_id
		)
		SELECT
			EXISTS(SELECT 1 FROM discussion_info) AS discussion_exists,
			EXISTS(SELECT 1 FROM discussion_info WHERE user_id = $2) AS is_owner,
			COALESCE((SELECT is_authorized FROM auth), false) AS is_authorized,
			(SELECT row_to_json(updated_with_user.*) FROM updated_with_user) AS updated_data
	`

	err := m.DB.Get(&result, query, id, userID, content)
	if err != nil {
		return nil, err
	}

	switch {
	case !result.DiscussionExists:
		return nil, ErrDiscussionNotFound
	case !result.IsOwner:
		return nil, ErrAccessDenied
	case !result.IsAuthorized:
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

func (m *DiscussionsModule) StudentDeleteRepository(id, userID string) (string, error) {
	var result struct {
		DiscussionExists bool    `db:"discussion_exists"`
		IsOwner          bool    `db:"is_owner"`
		IsAuthorized     bool    `db:"is_authorized"`
		DeletedID        *string `db:"deleted_id"`
	}

	query := `
		WITH discussion_info AS (
			SELECT id, user_id, course_id FROM discussions WHERE id = $1
		),
		auth AS (
			SELECT EXISTS (
				SELECT 1 FROM enrollments e
				JOIN discussion_info di ON e.course_id = di.course_id
				WHERE e.user_id = $2 AND e.revoked = false
			) AS is_authorized
		),
		deleted AS (
			DELETE FROM discussions
			USING discussion_info di, auth a
			WHERE discussions.id = $1 AND discussions.user_id = $2 AND a.is_authorized = true
			RETURNING discussions.id
		)
		SELECT
			EXISTS(SELECT 1 FROM discussion_info) AS discussion_exists,
			EXISTS(SELECT 1 FROM discussion_info WHERE user_id = $2) AS is_owner,
			COALESCE((SELECT is_authorized FROM auth), false) AS is_authorized,
			(SELECT id FROM deleted) AS deleted_id
	`

	err := m.DB.Get(&result, query, id, userID)
	if err != nil {
		return "", err
	}

	switch {
	case !result.DiscussionExists:
		return "", ErrDiscussionNotFound
	case !result.IsOwner:
		return "", ErrAccessDenied
	case !result.IsAuthorized:
		return "", ErrNotEnrolled
	case result.DeletedID == nil:
		return "", errors.New("failed to delete discussion")
	}

	return *result.DeletedID, nil
}
