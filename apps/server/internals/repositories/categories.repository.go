package repositories

import (
	"coursehunt/server/internals/entities"
	"coursehunt/server/internals/pkg/cache"
	"encoding/json"
	"fmt"

	"github.com/jmoiron/sqlx"
)

type CategoriesRepository struct {
	DB    *sqlx.DB
	Cache *cache.Cache
}

func NewCategoriesRepository(db *sqlx.DB, cache *cache.Cache) *CategoriesRepository {
	return &CategoriesRepository{DB: db, Cache: cache}
}

// ListRepository returns paginated root categories with their subcategories.
func (r *CategoriesRepository) ListRepository(page, limit int, name string) ([]entities.Category, int, error) {
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
	err := r.DB.Get(&result, fmt.Sprintf(`
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

	var roots []entities.Category
	if err := json.Unmarshal(result.Data, &roots); err != nil {
		return nil, 0, err
	}
	return roots, result.Total, nil
}

func (r *CategoriesRepository) CreateRepository(name string, parentID *string) (*entities.Category, error) {
	var cat entities.Category
	cat.Subcategories = []entities.Category{} // Pre-initialize slice to avoid returning 'null' in future JSON operations

	query := `INSERT INTO categories (name, parent_id)
	          VALUES ($1, $2)
	          RETURNING id, parent_id, name, created_at`

	// Struct mapping eliminates manual .Scan calls
	if err := r.DB.Get(&cat, query, name, parentID); err != nil {
		return nil, err
	}
	return &cat, nil
}

func (r *CategoriesRepository) UpdateRepository(id, name string) (*entities.Category, error) {
	var cat entities.Category
	cat.Subcategories = []entities.Category{}

	query := `UPDATE categories
	          SET name = $1
	          WHERE id = $2
	          RETURNING id, parent_id, name, created_at`

	if err := r.DB.Get(&cat, query, name, id); err != nil {
		return nil, err
	}
	return &cat, nil
}

func (r *CategoriesRepository) DeleteRepository(id string) (string, error) {
	var deletedID string
	query := `DELETE FROM categories WHERE id = $1 RETURNING id`

	if err := r.DB.Get(&deletedID, query, id); err != nil {
		return "", err
	}
	return deletedID, nil
}
