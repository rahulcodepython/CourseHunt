package category

import (
	"encoding/json"
	"fmt"
)

// ListRepository returns paginated root categories with their subcategories.
func (m *CategoryModule) ListRepository(page, limit int, name string) ([]Category, int, error) {
	offset := (page - 1) * limit

	args := []any{limit, offset}
	nameFilter := ""
	idx := 3
	if name != "" {
		nameFilter = fmt.Sprintf(" AND c.name ILIKE $%d", idx)
		args = append(args, "%"+name+"%")
		idx++
	}

	var result struct {
		Total int             `db:"total_count"`
		Data  json.RawMessage `db:"data_json"`
	}
	err := m.DB.Get(&result, fmt.Sprintf(`
		WITH count_cte AS (
			SELECT COUNT(*) AS total_count FROM categories WHERE parent_id IS NULL%s
		),
		root_cte AS (
			SELECT id FROM categories WHERE parent_id IS NULL%s
			ORDER BY name LIMIT $1 OFFSET $2
		),
		sub_cte AS (
			SELECT s.parent_id,
				   json_agg(
				   		json_build_object(
				   			'id', s.id,
				   			'parent_id', s.parent_id,
				   			'name', s.name,
				   			'created_at', s.created_at,
				   			'subcategories', '[]'::json
				   		) ORDER BY s.name
				   ) AS subcategories
			FROM categories s
			WHERE s.parent_id IN (SELECT id FROM root_cte)
			GROUP BY s.parent_id
		),
		data_cte AS (
			SELECT
				json_build_object(
					'id', c.id,
					'parent_id', c.parent_id,
					'name', c.name,
					'created_at', c.created_at,
					'subcategories', COALESCE(sc.subcategories, '[]'::json)
				) AS cat_data
			FROM categories c
			LEFT JOIN sub_cte sc ON sc.parent_id = c.id
			WHERE c.id IN (SELECT id FROM root_cte)
			ORDER BY c.name
		)
		SELECT
			COALESCE((SELECT total_count FROM count_cte), 0) AS total_count,
			COALESCE((SELECT json_agg(cat_data) FROM data_cte), '[]'::json) AS data_json
	`, nameFilter, nameFilter), args...)
	if err != nil {
		return nil, 0, err
	}

	var roots []Category
	if err := json.Unmarshal(result.Data, &roots); err != nil {
		return nil, 0, err
	}
	return roots, result.Total, nil
}

func (m *CategoryModule) CreateRepository(name string, parentID *string) (*Category, error) {
	var cat Category
	cat.Subcategories = []Category{} // Pre-initialize slice to avoid returning 'null' in future JSON operations

	query := `INSERT INTO categories (name, parent_id)
	          VALUES ($1, $2)
	          RETURNING id, parent_id, name, created_at`

	// Struct mapping eliminates manual .Scan calls
	if err := m.DB.Get(&cat, query, name, parentID); err != nil {
		return nil, err
	}
	return &cat, nil
}

func (m *CategoryModule) UpdateRepository(id, name string) (*Category, error) {
	var cat Category
	cat.Subcategories = []Category{}

	query := `UPDATE categories
	          SET name = $1
	          WHERE id = $2
	          RETURNING id, parent_id, name, created_at`

	if err := m.DB.Get(&cat, query, name, id); err != nil {
		return nil, err
	}
	return &cat, nil
}

func (m *CategoryModule) DeleteRepository(id string) (string, error) {
	var deletedID string
	query := `DELETE FROM categories WHERE id = $1 RETURNING id`

	if err := m.DB.Get(&deletedID, query, id); err != nil {
		return "", err
	}
	return deletedID, nil
}
