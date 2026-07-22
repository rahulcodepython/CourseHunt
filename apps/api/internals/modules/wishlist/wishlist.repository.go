package wishlist

import "encoding/json"

func (m *WishlistModule) CreateRepository(userID, courseID string) (*WishlistItem, error) {
	var w WishlistItem
	err := m.DB.Get(&w, `
		INSERT INTO wishlists (user_id, course_id)
		VALUES ($1, $2)
		ON CONFLICT (user_id, course_id) DO UPDATE SET added_at = NOW()
		RETURNING id, user_id, course_id, added_at`, userID, courseID)
	return &w, err
}

func (m *WishlistModule) DeleteRepository(userID, id string) (string, error) {
	err := m.DB.Get(&id, `DELETE FROM wishlists WHERE user_id = $1 AND id = $2 RETURNING id`, userID, id)
	return id, err
}

func (m *WishlistModule) ListRepository(userID string) ([]WishlistItem, error) {
	var data json.RawMessage
	err := m.DB.Get(&data, `
		SELECT json_agg(data_cte ORDER BY data_cte.added_at DESC)
		FROM (
			SELECT
				w.id AS id,
				w.user_id AS user_id,
				w.added_at AS added_at,
				w.course_id AS "course.id",
				COALESCE(c.title, '') AS "course.title",
				c.image_url AS "course.thumbnail"
			FROM wishlists w
			LEFT JOIN courses c ON w.course_id = c.id
			WHERE w.user_id = $1
		) data_cte`, userID)
	if err != nil {
		return nil, err
	}

	var list []WishlistItem
	if data != nil {
		if err := json.Unmarshal(data, &list); err != nil {
			return nil, err
		}
	}
	return list, nil
}

func (m *WishlistModule) ClearRepository(userID string) error {
	_, err := m.DB.Exec(`DELETE FROM wishlists WHERE user_id = $1`, userID)
	return err
}
