package cart

func (c *CartModule) AddRepository(userID, courseID string) (*CartItem, error) {
	var ci CartItem
	err := c.DB.QueryRow(`
		WITH inserted AS (
			INSERT INTO cart_items (user_id, course_id) 
			VALUES ($1, $2) 
			ON CONFLICT (user_id, course_id) DO UPDATE SET added_at = NOW() 
			RETURNING id, user_id, course_id, added_at
		)
		SELECT 
			i.id, 
			i.user_id, 
			i.course_id, 
			COALESCE(co.title, '') AS course_name, 
			COALESCE(co.image_url, '') AS course_thumbnail, 
			i.added_at 
		FROM inserted i
		LEFT JOIN courses co ON i.course_id = co.id
	`, userID, courseID).Scan(&ci.ID, &ci.UserID, &ci.CourseID, &ci.CourseName, &ci.CourseThumbnail, &ci.AddedAt)
	if err != nil {
		return nil, err
	}
	return &ci, nil
}

func (c *CartModule) RemoveRepository(userID, courseID string) (string, error) {
	var id string
	err := c.DB.QueryRow(`DELETE FROM cart_items WHERE user_id = $1 AND course_id = $2 RETURNING id`, userID, courseID).Scan(&id)
	return id, err
}

func (c *CartModule) ListRepository(userID string) ([]CartItem, error) {
	rows, err := c.DB.Query(`
		SELECT 
			ci.id, 
			ci.user_id, 
			ci.course_id, 
			COALESCE(co.title, '') AS course_name, 
			COALESCE(co.image_url, '') AS course_thumbnail, 
			ci.added_at 
		FROM cart_items ci
		LEFT JOIN courses co ON ci.course_id = co.id
		WHERE ci.user_id = $1 
		ORDER BY ci.added_at DESC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []CartItem
	for rows.Next() {
		var ci CartItem
		if err := rows.Scan(&ci.ID, &ci.UserID, &ci.CourseID, &ci.CourseName, &ci.CourseThumbnail, &ci.AddedAt); err != nil {
			return nil, err
		}
		list = append(list, ci)
	}

	if list == nil {
		list = []CartItem{}
	}
	return list, rows.Err()
}

func (c *CartModule) ClearRepository(userID string) error {
	_, err := c.DB.Exec(`DELETE FROM cart_items WHERE user_id = $1`, userID)
	return err
}
