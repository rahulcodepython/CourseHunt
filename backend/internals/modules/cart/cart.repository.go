package cart

func (c *CartModule) AddRepository(userID, courseID string) (*CartItem, error) {
	var ci CartItem

	query := `
		WITH inserted AS (
			INSERT INTO cart_items (user_id, course_id)
			SELECT $1, $2
			WHERE NOT EXISTS (
				SELECT 1 FROM enrollments WHERE user_id = $1 AND course_id = $2 AND revoked = false
			)
			ON CONFLICT (user_id, course_id) DO UPDATE SET added_at = NOW()
			RETURNING id, user_id, course_id, added_at
		)
		SELECT
			i.id AS id,
			i.user_id AS user_id,
			i.added_at AS added_at,
			i.course_id AS "course.id",
			COALESCE(co.title, '') AS "course.title",
			co.image_url AS "course.thumbnail"
		FROM inserted i
		LEFT JOIN courses co ON i.course_id = co.id
	`

	// sqlx maps the dot-notation aliases directly into your nested struct
	err := c.DB.Get(&ci, query, userID, courseID)
	if err != nil {
		return nil, err
	}

	return &ci, nil
}

func (c *CartModule) RemoveRepository(userID, id string) (string, error) {
	err := c.DB.Get(&id, `DELETE FROM cart_items WHERE user_id = $1 AND id = $2 RETURNING id`, userID, id)
	return id, err
}

func (c *CartModule) ListRepository(userID string) ([]CartItem, error) {
	var list []CartItem

	query := `
		SELECT
			ci.id AS id,
			ci.user_id AS user_id,
			ci.added_at AS added_at,
			ci.course_id AS "course.id",
			COALESCE(co.title, '') AS "course.title",
			co.image_url AS "course.thumbnail"
		FROM cart_items ci
		LEFT JOIN courses co ON ci.course_id = co.id
		WHERE ci.user_id = $1
		ORDER BY ci.added_at DESC
	`

	err := c.DB.Select(&list, query, userID)
	if err != nil {
		return nil, err
	}
	return list, nil
}

func (c *CartModule) ClearRepository(userID string) error {
	_, err := c.DB.Exec(`DELETE FROM cart_items WHERE user_id = $1`, userID)
	return err
}
