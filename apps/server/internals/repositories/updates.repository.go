package repositories

import (
	"coursehunt/server/internals/entities"
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/pkg/cache"
	"encoding/json"

	"github.com/jmoiron/sqlx"
)

type UpdatesRepository struct {
	DB    *sqlx.DB
	Cache *cache.Cache
}

func NewUpdatesRepository(db *sqlx.DB, cache *cache.Cache) *UpdatesRepository {
	return &UpdatesRepository{DB: db, Cache: cache}
}

func (r *UpdatesRepository) CreateRepository(createdBy string, req entities.CreateUpdateRequest) (*entities.CourseUpdate, error) {
	var data []byte
	err := r.DB.Get(&data, `
		WITH inserted AS (
			INSERT INTO updates (course_id, created_by, message)
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

	var u entities.CourseUpdate
	err = json.Unmarshal(data, &u)
	return &u, err
}

func (r *UpdatesRepository) UpdateRepository(id string, message string) (*entities.CourseUpdate, error) {
	var data []byte
	err := r.DB.Get(&data, `
		WITH updated AS (
			UPDATE updates SET message = $1 WHERE id = $2
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

	var u entities.CourseUpdate
	err = json.Unmarshal(data, &u)
	return &u, err
}

func (r *UpdatesRepository) DeleteRepository(id string) (string, error) {
	var deletedID string
	err := r.DB.Get(&deletedID, `DELETE FROM updates WHERE id = $1 RETURNING id`, id)
	return deletedID, err
}

func (r *UpdatesRepository) FeedRepository(userID string, page, limit int) (*entities.UpdateFeedResponse, error) {
	offset := (page - 1) * limit

	var result struct {
		Total   int             `db:"total"`
		Updates json.RawMessage `db:"updates"`
	}

	err := r.DB.Get(&result, `
		WITH current_seen AS (
			SELECT u.created_at AS last_seen_at
			FROM update_seen us
			JOIN updates u ON u.id = us.update_id
			WHERE us.user_id = $1
			ORDER BY u.created_at DESC
			LIMIT 1
		),
		latest_update AS (
			SELECT u.id
			FROM updates u
			WHERE (u.course_id IS NULL OR u.course_id IN (SELECT course_id FROM enrollments WHERE user_id = $1 AND revoked = false))
			ORDER BY u.created_at DESC
			LIMIT 1
		),
		upsert_seen AS (
			INSERT INTO update_seen (user_id, update_id)
			SELECT $1, id FROM latest_update
			ON CONFLICT (user_id, update_id) DO UPDATE SET seen_at = CURRENT_TIMESTAMP
			RETURNING 1
		),
		eligible_updates AS (
			SELECT u.id, u.message, u.created_at,
				   json_build_object(
				   		'id', COALESCE(u.course_id, ''),
				   		'title', COALESCE(c.title, ''),
				   		'thumbnail', c.image_url
				   ) AS course,
				   (u.created_at > COALESCE((SELECT last_seen_at FROM current_seen), '-infinity'::timestamptz)) AS is_unseen
			FROM updates u
			LEFT JOIN courses c ON c.id = u.course_id
			WHERE (u.course_id IS NULL OR u.course_id IN (SELECT course_id FROM enrollments WHERE user_id = $1 AND revoked = false))
		),
		count_cte AS (
			SELECT COUNT(*) AS total FROM eligible_updates
		),
		data_cte AS (
			SELECT id, message, created_at, course, is_unseen
			FROM eligible_updates
			ORDER BY is_unseen DESC, created_at DESC
			LIMIT $2 OFFSET $3
		)
		SELECT 
			COALESCE((SELECT total FROM count_cte), 0) AS total,
			COALESCE((SELECT json_agg(data_cte) FROM data_cte), '[]'::json) AS updates`,
		userID, limit, offset,
	)
	if err != nil {
		return nil, err
	}

	var updates []entities.UpdateFeedItem
	if err := json.Unmarshal(result.Updates, &updates); err != nil {
		return nil, err
	}

	return &entities.UpdateFeedResponse{
		Updates: generic.PaginatedResponse[[]entities.UpdateFeedItem]{
			Data: updates, Total: result.Total, Page: page, Limit: limit,
		},
	}, nil
}

func (r *UpdatesRepository) ListRepository(page, limit int) ([]entities.CourseUpdate, int, error) {
	offset := (page - 1) * limit

	var result struct {
		Total int             `db:"total"`
		Data  json.RawMessage `db:"data"`
	}
	err := r.DB.Get(&result, `
		WITH count_cte AS (
			SELECT COUNT(*) AS total FROM updates
		),
		data_cte AS (
			SELECT u.id, u.created_by, u.message, u.created_at,
				   json_build_object(
				   		'id', COALESCE(u.course_id, ''),
				   		'title', COALESCE(c.title, ''),
				   		'thumbnail', c.image_url
				   ) AS course
			FROM updates u
			LEFT JOIN courses c ON c.id = u.course_id
			ORDER BY u.created_at DESC LIMIT $1 OFFSET $2
		)
		SELECT 
			COALESCE((SELECT total FROM count_cte), 0) AS total,
			COALESCE((SELECT json_agg(data_cte) FROM data_cte), '[]'::json) AS data`, limit, offset)
	if err != nil {
		return nil, 0, err
	}

	var list []entities.CourseUpdate
	if err := json.Unmarshal(result.Data, &list); err != nil {
		return nil, 0, err
	}

	return list, result.Total, nil
}
