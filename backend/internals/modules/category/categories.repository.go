package category

func (c *CategoryModule) ListRepository() ([]Category, error) {
	rows, err := c.DB.Query(`SELECT id, parent_id, name, created_at FROM categories ORDER BY name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var allCats []Category
	for rows.Next() {
		var cat Category
		if err := rows.Scan(&cat.ID, &cat.ParentID, &cat.Name, &cat.CreatedAt); err != nil {
			return nil, err
		}
		cat.Subcategories = []Category{}
		allCats = append(allCats, cat)
	}

	childrenMap := make(map[string][]Category)
	var roots []Category

	for _, cat := range allCats {
		if cat.ParentID == nil {
			roots = append(roots, cat)
		} else {
			childrenMap[*cat.ParentID] = append(childrenMap[*cat.ParentID], cat)
		}
	}

	var buildTree func(cat *Category)
	buildTree = func(cat *Category) {
		cat.Subcategories = childrenMap[cat.ID]
		if cat.Subcategories == nil {
			cat.Subcategories = []Category{}
		}
		for i := range cat.Subcategories {
			buildTree(&cat.Subcategories[i])
		}
	}

	for i := range roots {
		buildTree(&roots[i])
	}

	if roots == nil {
		roots = []Category{}
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
