package wishlist

func (m *WishlistModule) CreateRepository(userID, courseID string) (*Wishlist, error) {
	var w Wishlist
	err := m.DB.QueryRow(`
		INSERT INTO wishlists (user_id, course_id) 
		VALUES ($1, $2) 
		ON CONFLICT (user_id, course_id) DO UPDATE SET added_at = wishlists.added_at
		RETURNING id, user_id, course_id, added_at`,
		userID, courseID,
	).Scan(&w.ID, &w.UserID, &w.Course.ID, &w.AddedAt)
	return &w, err
}

func (m *WishlistModule) DeleteRepository(userID, courseID string) (string, error) {
	var deletedID string
	err := m.DB.QueryRow(`DELETE FROM wishlists WHERE user_id = $1 AND course_id = $2 RETURNING id`, userID, courseID).Scan(&deletedID)
	return deletedID, err
}

func (m *WishlistModule) ListRepository(userID string) ([]Wishlist, error) {
	rows, err := m.DB.Query(`SELECT w.id, w.user_id, w.course_id, c.title, c.thumbnail, w.added_at FROM wishlists w LEFT JOIN courses c ON c.id = w.course_id WHERE w.user_id = $1 ORDER BY w.added_at DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []Wishlist
	for rows.Next() {
		var w Wishlist
		if err := rows.Scan(&w.ID, &w.UserID, &w.Course.ID, &w.Course.Title, &w.Course.Thumbnail, &w.AddedAt); err != nil {
			return nil, err
		}
		list = append(list, w)
	}
	if list == nil {
		list = []Wishlist{}
	}
	return list, rows.Err()
}
