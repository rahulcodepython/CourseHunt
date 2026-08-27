package repositories

import (
	"coursehunt/server/internals/entities"
	"coursehunt/server/internals/pkg/cache"
	"encoding/json"

	"github.com/jmoiron/sqlx"
)

type WishlistRepository struct {
	DB    *sqlx.DB
	Cache *cache.Cache
}

func NewWishlistRepository(db *sqlx.DB, cache *cache.Cache) *WishlistRepository {
	return &WishlistRepository{DB: db, Cache: cache}
}

func (r *WishlistRepository) CreateRepository(userID, courseID string) (*entities.WishlistItem, error) {
	var w entities.WishlistItem
	err := r.DB.Get(&w, `
		INSERT INTO wishlists (user_id, course_id)
		VALUES ($1, $2)
		ON CONFLICT (user_id, course_id) DO UPDATE SET added_at = NOW()
		RETURNING id, user_id, course_id, added_at`, userID, courseID)
	return &w, err
}

func (r *WishlistRepository) DeleteRepository(userID, id string) (string, error) {
	err := r.DB.Get(&id, `DELETE FROM wishlists WHERE user_id = $1 AND id = $2 RETURNING id`, userID, id)
	return id, err
}

func (r *WishlistRepository) ListRepository(userID string, page, limit int) ([]entities.WishlistItem, int, error) {
	offset := (page - 1) * limit

	var result struct {
		Total int             `db:"total_count"`
		Data  json.RawMessage `db:"data_json"`
	}
	err := r.DB.Get(&result, `
		WITH count_cte AS (
			SELECT COUNT(*) AS total_count
			FROM wishlists w
			WHERE w.user_id = $1
		),
		data_cte AS (
			SELECT w.id, w.user_id, w.added_at,
				   json_build_object(
				   		'id', COALESCE(w.course_id::text, ''),
				   		'slug', COALESCE(c.slug, ''),
				   		'title', COALESCE(c.title, ''),
				   		'thumbnail', c.image_url
				   ) AS course
			FROM wishlists w
			LEFT JOIN courses c ON w.course_id = c.id
			WHERE w.user_id = $1
			ORDER BY w.added_at DESC
			LIMIT $2 OFFSET $3
		)
		SELECT
			COALESCE((SELECT total_count FROM count_cte), 0) AS total_count,
			COALESCE((SELECT json_agg(data_cte) FROM data_cte), '[]'::json) AS data_json`, userID, limit, offset)
	if err != nil {
		return nil, 0, err
	}

	var list []entities.WishlistItem
	if result.Data != nil {
		if err := json.Unmarshal(result.Data, &list); err != nil {
			return nil, 0, err
		}
	}
	return list, result.Total, nil
}

func (r *WishlistRepository) ClearRepository(userID string) error {
	_, err := r.DB.Exec(`DELETE FROM wishlists WHERE user_id = $1`, userID)
	return err
}
