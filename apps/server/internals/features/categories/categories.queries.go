package categories

const (
	ListCategoriesJSON = `
		SELECT jsonb_build_object(
			'total', COALESCE((SELECT COUNT(*) FROM categories WHERE parent_id IS NULL AND ($3 = '' OR name ILIKE '%' || $3 || '%')), 0),
			'data', COALESCE((
				SELECT jsonb_agg(
					jsonb_build_object(
						'id', c.id,
						'parent_id', c.parent_id,
						'name', c.name,
						'created_at', c.created_at,
						'subcategories', COALESCE((
							SELECT jsonb_agg(
								jsonb_build_object(
									'id', s.id,
									'parent_id', s.parent_id,
									'name', s.name,
									'created_at', s.created_at,
									'subcategories', '[]'::jsonb
								) ORDER BY s.name
							)
							FROM categories s
							WHERE s.parent_id = c.id
						), '[]'::jsonb)
					) ORDER BY c.name
				)
				FROM (
					SELECT id, parent_id, name, created_at
					FROM categories
					WHERE parent_id IS NULL AND ($3 = '' OR name ILIKE '%' || $3 || '%')
					ORDER BY name
					LIMIT $1 OFFSET $2
				) c
			), '[]'::jsonb)
		);
	`

	CreateCategoryJSON = `
		SELECT jsonb_build_object(
			'id', id, 'parent_id', parent_id, 'name', name, 'created_at', created_at, 'subcategories', '[]'::jsonb
		) FROM (
			INSERT INTO categories (name, parent_id)
			VALUES ($1, $2)
			RETURNING id, parent_id, name, created_at
		) c;
	`

	UpdateCategoryJSON = `
		SELECT jsonb_build_object(
			'id', id, 'parent_id', parent_id, 'name', name, 'created_at', created_at, 'subcategories', '[]'::jsonb
		) FROM (
			UPDATE categories
			SET name = $1
			WHERE id = $2
			RETURNING id, parent_id, name, created_at
		) c;
	`

	DeleteCategory = `DELETE FROM categories WHERE id = $1 RETURNING id`
)
