package updates

import (
	"coursehunt/api/internals/models"
	"encoding/json"
)

func (m *UpdatesModule) CreateRepository(createdBy string, req CreateUpdateRequest) (*CourseUpdate, error) {
	var data []byte
	err := m.DB.Get(&data, `
		WITH inserted AS (
			INSERT INTO course_updates (course_id, created_by, message)
			VALUES ($1, $2, $3)
			RETURNING id, course_id, created_by, message, created_at
		)
		SELECT json_build_object(
			'id', i.id,
			'created_by', i.created_by,
			'message', i.message,
			'created_at', i.created_at,
			'course', json_build_object(
				'id', COALESCE(i.course_id, ''),
				'title', COALESCE(c.title, ''),
				'thumbnail', c.image_url
			)
		)
		FROM inserted i
		LEFT JOIN courses c ON c.id = i.course_id`,
		req.CourseID, createdBy, req.Message,
	)
	if err != nil {
		return nil, err
	}

	var u CourseUpdate
	err = json.Unmarshal(data, &u)
	return &u, err
}

func (m *UpdatesModule) UpdateRepository(id string, message string) (*CourseUpdate, error) {
	var data []byte
	err := m.DB.Get(&data, `
		WITH updated AS (
			UPDATE course_updates SET message = $1 WHERE id = $2
			RETURNING id, course_id, created_by, message, created_at
		)
		SELECT json_build_object(
			'id', u.id,
			'created_by', u.created_by,
			'message', u.message,
			'created_at', u.created_at,
			'course', json_build_object(
				'id', COALESCE(u.course_id, ''),
				'title', COALESCE(c.title, ''),
				'thumbnail', c.image_url
			)
		)
		FROM updated u
		LEFT JOIN courses c ON c.id = u.course_id`,
		message, id,
	)
	if err != nil {
		return nil, err
	}

	var u CourseUpdate
	err = json.Unmarshal(data, &u)
	return &u, err
}

func (m *UpdatesModule) DeleteRepository(id string) (string, error) {
	var deletedID string
	err := m.DB.Get(&deletedID, `DELETE FROM course_updates WHERE id = $1 RETURNING id`, id)
	return deletedID, err
}

func (m *UpdatesModule) FeedRepository(userID string, page, limit int) (*UpdateFeedResponse, error) {
	offset := (page - 1) * limit

	var result struct {
		Unseen json.RawMessage `db:"unseen"`
		Total  int             `db:"total"`
		Older  json.RawMessage `db:"older"`
	}

	err := m.DB.Get(&result, `
		WITH target_unseen AS (
			SELECT cu.id
			FROM course_updates cu
			LEFT JOIN update_seen us ON us.update_id = cu.id AND us.user_id = $1
			WHERE us.id IS NULL
			  AND (cu.course_id IS NULL OR cu.course_id IN (SELECT course_id FROM enrollments WHERE user_id = $1 AND revoked = false))
		),
		mark_as_seen AS (
			INSERT INTO update_seen (user_id, update_id)
			SELECT $1, id FROM target_unseen
			ON CONFLICT DO NOTHING
		),
		unseen_cte AS (
			SELECT cu.id, cu.message, cu.created_at,
				   json_build_object(
				   		'id', COALESCE(cu.course_id, ''),
				   		'title', COALESCE(c.title, ''),
				   		'thumbnail', c.image_url
				   ) AS course
			FROM course_updates cu
			LEFT JOIN courses c ON c.id = cu.course_id
			WHERE cu.id IN (SELECT id FROM target_unseen)
			ORDER BY cu.created_at DESC
		),
		count_cte AS (
			SELECT COUNT(*) AS total
			FROM course_updates cu
			WHERE (cu.course_id IS NULL OR cu.course_id IN (SELECT course_id FROM enrollments WHERE user_id = $1 AND revoked = false))
		),
		older_cte AS (
			SELECT cu.id, cu.message, cu.created_at,
				   json_build_object(
				   		'id', COALESCE(cu.course_id, ''),
				   		'title', COALESCE(c.title, ''),
				   		'thumbnail', c.image_url
				   ) AS course
			FROM course_updates cu
			LEFT JOIN courses c ON c.id = cu.course_id
			WHERE (cu.course_id IS NULL OR cu.course_id IN (SELECT course_id FROM enrollments WHERE user_id = $1 AND revoked = false))
			ORDER BY cu.created_at DESC
			LIMIT $2 OFFSET $3
		)
		SELECT 
			COALESCE((SELECT json_agg(unseen_cte) FROM unseen_cte), '[]'::json) AS unseen,
			COALESCE((SELECT total FROM count_cte), 0) AS total,
			COALESCE((SELECT json_agg(older_cte) FROM older_cte), '[]'::json) AS older`,
		userID, limit, offset,
	)
	if err != nil {
		return nil, err
	}

	var unseen []UpdateFeedItem
	if err := json.Unmarshal(result.Unseen, &unseen); err != nil {
		return nil, err
	}

	var older []UpdateFeedItem
	if err := json.Unmarshal(result.Older, &older); err != nil {
		return nil, err
	}

	return &UpdateFeedResponse{
		Unseen: unseen,
		Older: models.PaginatedResponse[[]UpdateFeedItem]{
			Data: older, Total: result.Total, Page: page, Limit: limit,
		},
	}, nil
}

func (m *UpdatesModule) ListRepository(page, limit int) ([]CourseUpdate, int, error) {
	offset := (page - 1) * limit

	var result struct {
		Total int             `db:"total"`
		Data  json.RawMessage `db:"data"`
	}
	err := m.DB.Get(&result, `
		WITH count_cte AS (
			SELECT COUNT(*) AS total FROM course_updates
		),
		data_cte AS (
			SELECT cu.id, cu.created_by, cu.message, cu.created_at,
				   json_build_object(
				   		'id', COALESCE(cu.course_id, ''),
				   		'title', COALESCE(c.title, ''),
				   		'thumbnail', c.image_url
				   ) AS course
			FROM course_updates cu
			LEFT JOIN courses c ON c.id = cu.course_id
			ORDER BY cu.created_at DESC LIMIT $1 OFFSET $2
		)
		SELECT 
			COALESCE((SELECT total FROM count_cte), 0) AS total,
			COALESCE((SELECT json_agg(data_cte) FROM data_cte), '[]'::json) AS data`, limit, offset)
	if err != nil {
		return nil, 0, err
	}

	var list []CourseUpdate
	if err := json.Unmarshal(result.Data, &list); err != nil {
		return nil, 0, err
	}

	return list, result.Total, nil
}
