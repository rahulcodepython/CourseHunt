package discussions

import (
	"encoding/json"
	"errors"
)

func (m *DiscussionsModule) TutorDeleteRepository(id, tutorID string) (string, error) {
	var result struct {
		DiscussionExists bool    `db:"discussion_exists"`
		IsOwner          bool    `db:"is_owner"`
		DeletedID        *string `db:"deleted_id"`
	}

	query := `
		WITH discussion_info AS (
			SELECT d.id, c.tutor_id
			FROM discussions d
			JOIN courses c ON c.id = d.course_id
			WHERE d.id = $1
		),
		deleted AS (
			DELETE FROM discussions
			USING discussion_info di
			WHERE discussions.id = $1 AND di.tutor_id = $2
			RETURNING discussions.id
		)
		SELECT
			EXISTS(SELECT 1 FROM discussion_info) AS discussion_exists,
			EXISTS(SELECT 1 FROM discussion_info WHERE tutor_id = $2) AS is_owner,
			(SELECT id FROM deleted) AS deleted_id
	`

	err := m.DB.Get(&result, query, id, tutorID)
	if err != nil {
		return "", err
	}

	switch {
	case !result.DiscussionExists:
		return "", ErrDiscussionNotFound
	case !result.IsOwner:
		return "", ErrAccessDenied
	case result.DeletedID == nil:
		return "", errors.New("failed to delete discussion")
	}

	return *result.DeletedID, nil
}

func (m *DiscussionsModule) AdminDeleteRepository(id string) (string, error) {
	var result struct {
		DiscussionExists bool    `db:"discussion_exists"`
		DeletedID        *string `db:"deleted_id"`
	}

	query := `
		WITH deleted AS (
			DELETE FROM discussions WHERE id = $1 RETURNING id
		)
		SELECT
			EXISTS(SELECT 1 FROM discussions WHERE id = $1) AS discussion_exists,
			(SELECT id FROM deleted) AS deleted_id
	`

	err := m.DB.Get(&result, query, id)
	if err != nil {
		return "", err
	}

	switch {
	case !result.DiscussionExists:
		return "", ErrDiscussionNotFound
	case result.DeletedID == nil:
		return "", errors.New("failed to delete discussion")
	}

	return *result.DeletedID, nil
}

func (m *DiscussionsModule) AdminListRepository(page, limit int) ([]Discussion, int, error) {
	offset := (page - 1) * limit

	var result struct {
		Total int             `db:"total"`
		Data  json.RawMessage `db:"data"`
	}

	query := `
		WITH count_cte AS (
			SELECT COUNT(*) AS total FROM discussions
		),
		data_cte AS (
			SELECT d.id, d.lesson_id, d.course_id, d.parent_id, d.content, d.reply_count, d.created_at, d.updated_at,
			       json_build_object('id', u.id, 'name', COALESCE(u.name, ''), 'image', COALESCE(u.image, '')) AS "user"
			FROM discussions d
			JOIN "user" u ON u.id = d.user_id
			ORDER BY d.created_at DESC
			LIMIT $1 OFFSET $2
		)
		SELECT
			COALESCE((SELECT total FROM count_cte), 0) AS total,
			COALESCE((SELECT json_agg(data_cte) FROM data_cte), '[]'::json) AS data
	`

	err := m.DB.Get(&result, query, limit, offset)
	if err != nil {
		return nil, 0, err
	}

	var list []Discussion
	if err := json.Unmarshal(result.Data, &list); err != nil {
		return nil, 0, err
	}

	return list, result.Total, nil
}
