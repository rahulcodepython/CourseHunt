package category

import (
	"encoding/json"
)

// ListRepository remains highly optimized by leveraging Postgres JSON functions,
// but now reads into a string/byte slice via c.DB.Get.
func (c *CategoryModule) ListRepository() ([]Category, error) {
	var jsonBytes []byte
	query := `
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
		WHERE c.parent_id IS NULL`

	// Automatically executes and maps the single column outcome to jsonBytes
	if err := c.DB.Get(&jsonBytes, query); err != nil {
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
	cat.Subcategories = []Category{} // Pre-initialize slice to avoid returning 'null' in future JSON operations

	query := `INSERT INTO categories (name, parent_id)
	          VALUES ($1, $2)
	          RETURNING id, parent_id, name, created_at`

	// Struct mapping eliminates manual .Scan calls
	if err := c.DB.Get(&cat, query, name, parentID); err != nil {
		return nil, err
	}
	return &cat, nil
}

func (c *CategoryModule) UpdateRepository(id, name string) (*Category, error) {
	var cat Category
	cat.Subcategories = []Category{}

	query := `UPDATE categories
	          SET name = $1
	          WHERE id = $2
	          RETURNING id, parent_id, name, created_at`

	if err := c.DB.Get(&cat, query, name, id); err != nil {
		return nil, err
	}
	return &cat, nil
}

func (c *CategoryModule) DeleteRepository(id string) (string, error) {
	var deletedID string
	query := `DELETE FROM categories WHERE id = $1 RETURNING id`

	if err := c.DB.Get(&deletedID, query, id); err != nil {
		return "", err
	}
	return deletedID, nil
}
