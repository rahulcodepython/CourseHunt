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

	var u entities.CourseUpdate
	err = json.Unmarshal(data, &u)
	return &u, err
}

func (r *UpdatesRepository) UpdateRepository(id string, message string) (*entities.CourseUpdate, error) {
	var data []byte
	err := r.DB.Get(&data, `
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

	var u entities.CourseUpdate
	err = json.Unmarshal(data, &u)
	return &u, err
}

func (r *UpdatesRepository) DeleteRepository(id string) (string, error) {
	var deletedID string
	err := r.DB.Get(&deletedID, `DELETE FROM course_updates WHERE id = $1 RETURNING id`, id)
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
			SELECT cu.created_at AS last_seen_at
			FROM update_seen us
			JOIN course_updates cu ON cu.id = us.update_id
			WHERE us.user_id = $1
			ORDER BY cu.created_at DESC
			LIMIT 1
		),
		latest_update AS (
			SELECT cu.id
			FROM course_updates cu
			WHERE (cu.course_id IS NULL OR cu.course_id IN (SELECT course_id FROM enrollments WHERE user_id = $1 AND revoked = false))
			ORDER BY cu.created_at DESC
			LIMIT 1
		),
		upsert_seen AS (
			INSERT INTO update_seen (user_id, update_id)
			SELECT $1, id FROM latest_update
			ON CONFLICT (user_id, update_id) DO UPDATE SET seen_at = CURRENT_TIMESTAMP
			RETURNING 1
		),
		eligible_updates AS (
			SELECT cu.id, cu.message, cu.created_at,
				   json_build_object(
				   		'id', COALESCE(cu.course_id, ''),
				   		'title', COALESCE(c.title, ''),
				   		'thumbnail', c.image_url
				   ) AS course,
				   (cu.created_at > COALESCE((SELECT last_seen_at FROM current_seen), '-infinity'::timestamptz)) AS is_unseen
			FROM course_updates cu
			LEFT JOIN courses c ON c.id = cu.course_id
			WHERE (cu.course_id IS NULL OR cu.course_id IN (SELECT course_id FROM enrollments WHERE user_id = $1 AND revoked = false))
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

	var list []entities.CourseUpdate
	if err := json.Unmarshal(result.Data, &list); err != nil {
		return nil, 0, err
	}

	return list, result.Total, nil
}
