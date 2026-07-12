package wishlist

func (m *WishlistModule) CreateRepository(userID, courseID string) (*WishlistItem, error) {
	var w WishlistItem
	err := m.DB.Get(&w, `
		INSERT INTO wishlists (user_id, course_id)
		VALUES ($1, $2)
		ON CONFLICT (user_id, course_id) DO UPDATE SET added_at = wishlists.added_at
		RETURNING id, user_id, course_id, added_at`, userID, courseID)
	return &w, err
}

func (m *WishlistModule) DeleteRepository(userID, id string) (string, error) {
	err := m.DB.Get(&id, `DELETE FROM wishlists WHERE user_id = $1 AND id = $2 RETURNING id`, userID, id)
	return id, err
}

func (m *WishlistModule) ListRepository(userID string) ([]WishlistItem, error) {
	var list []WishlistItem
	err := m.DB.Select(&list, `
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
		ORDER BY w.added_at DESC`, userID)
	return list, err
}
