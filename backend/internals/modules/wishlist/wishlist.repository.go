package wishlist

func (m *WishlistModule) CreateRepository(userID, courseID string) (*Wishlist, error) {
	var w Wishlist
	err := m.DB.QueryRow(`
		INSERT INTO wishlists (user_id, course_id) 
		VALUES ($1, $2) 
		ON CONFLICT (user_id, course_id) DO UPDATE SET added_at = wishlists.added_at
		RETURNING id, user_id, course_id, added_at`,
		userID, courseID,
	).Scan(&w.ID, &w.UserID, &w.CourseID, &w.AddedAt)
	return &w, err
}

func (m *WishlistModule) DeleteRepository(userID, courseID string) (string, error) {
	var deletedID string
	err := m.DB.QueryRow(`DELETE FROM wishlists WHERE user_id = $1 AND course_id = $2 RETURNING id`, userID, courseID).Scan(&deletedID)
	return deletedID, err
}

func (m *WishlistModule) ListRepository(userID string) ([]Wishlist, error) {
	rows, err := m.DB.Query(`SELECT id, user_id, course_id, added_at FROM wishlists WHERE user_id = $1 ORDER BY added_at DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []Wishlist
	for rows.Next() {
		var w Wishlist
		if err := rows.Scan(&w.ID, &w.UserID, &w.CourseID, &w.AddedAt); err != nil {
			return nil, err
		}
		list = append(list, w)
	}
	if list == nil {
		list = []Wishlist{}
	}
	return list, rows.Err()
}
