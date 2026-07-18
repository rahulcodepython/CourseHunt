package cart

import "encoding/json"

func (m *CartModule) AddRepository(userID, courseID string) (*CartItem, error) {
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
	err := m.DB.Get(&ci, query, userID, courseID)
	if err != nil {
		return nil, err
	}

	return &ci, nil
}

func (m *CartModule) RemoveRepository(userID, id string) (string, error) {
	err := m.DB.Get(&id, `DELETE FROM cart_items WHERE user_id = $1 AND id = $2 RETURNING id`, userID, id)
	return id, err
}

func (m *CartModule) ListRepository(userID string, page, limit int) ([]CartItem, int, error) {
	offset := (page - 1) * limit

	var result struct {
		Total int             `db:"total_count"`
		Data  json.RawMessage `db:"data_json"`
	}
	err := m.DB.Get(&result, `
		WITH count_cte AS (
			SELECT COUNT(*) AS total_count FROM cart_items WHERE user_id = $1
		),
		data_cte AS (
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
			LIMIT $2 OFFSET $3
		)
		SELECT
			COALESCE((SELECT total_count FROM count_cte), 0) AS total_count,
			COALESCE((SELECT json_agg(data_cte) FROM data_cte), '[]'::json) AS data_json
	`, userID, limit, offset)
	if err != nil {
		return nil, 0, err
	}

	var list []CartItem
	if err := json.Unmarshal(result.Data, &list); err != nil {
		return nil, 0, err
	}
	return list, result.Total, nil
}

func (m *CartModule) ClearRepository(userID string) error {
	_, err := m.DB.Exec(`DELETE FROM cart_items WHERE user_id = $1`, userID)
	return err
}
