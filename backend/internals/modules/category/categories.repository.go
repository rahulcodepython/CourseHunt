package category

import (
	"encoding/json"
)

func (c *CategoryModule) ListRepository() ([]Category, error) {
	var jsonBytes []byte
	err := c.DB.QueryRow(`
		SELECT COALESCE(
			json_agg(
				json_build_object(
					'id', c.id,
					'parent_id', c.parent_id,
					'name', c.name,
					'created_at', c.created_at,
					'subcategories', COALESCE(
						(
							SELECT json_agg(
								json_build_object(
									'id', s.id,
									'parent_id', s.parent_id,
									'name', s.name,
									'created_at', s.created_at,
									'subcategories', '[]'::json
								) ORDER BY s.name
							)
							FROM categories s
							WHERE s.parent_id = c.id
						), '[]'::json
					)
				) ORDER BY c.name
			), '[]'::json
		)
		FROM categories c
		WHERE c.parent_id IS NULL
	`).Scan(&jsonBytes)
	if err != nil {
		return nil, err
	}

	var roots []Category
	if err := json.Unmarshal(jsonBytes, &roots); err != nil {
		return nil, err
	}

	return roots, nil
}

func (c *CategoryModule) CreateRepository(name string, parentID *string) (*Category, error) {
	var cat Category
	cat.Subcategories = []Category{}
	err := c.DB.QueryRow(`INSERT INTO categories (name, parent_id) VALUES ($1, $2) RETURNING id, parent_id, name, created_at`, name, parentID).
		Scan(&cat.ID, &cat.ParentID, &cat.Name, &cat.CreatedAt)
	return &cat, err
}

func (c *CategoryModule) UpdateRepository(id, name string) (*Category, error) {
	var cat Category
	cat.Subcategories = []Category{}
	err := c.DB.QueryRow(`UPDATE categories SET name = $1 WHERE id = $2 RETURNING id, parent_id, name, created_at`, name, id).
		Scan(&cat.ID, &cat.ParentID, &cat.Name, &cat.CreatedAt)
	return &cat, err
}

func (c *CategoryModule) DeleteRepository(id string) (string, error) {
	var deletedID string
	err := c.DB.QueryRow(`DELETE FROM categories WHERE id = $1 RETURNING id`, id).Scan(&deletedID)
	return deletedID, err
}
