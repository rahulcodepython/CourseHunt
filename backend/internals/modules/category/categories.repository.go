package categories

func (c *CategoryModule) ListRepository() ([]CategoryWithSubs, error) {
	rows, err := c.DB.Query(`SELECT id, name, created_at FROM categories ORDER BY name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var cats []CategoryWithSubs
	for rows.Next() {
		var cat CategoryWithSubs
		if err := rows.Scan(&cat.ID, &cat.Name, &cat.CreatedAt); err != nil {
			return nil, err
		}
		subs, _ := c.subcategories(cat.ID)
		cat.Subcategories = subs
		cats = append(cats, cat)
	}
	if cats == nil {
		cats = []CategoryWithSubs{}
	}
	return cats, rows.Err()
}

func (c *CategoryModule) subcategories(catID string) ([]Subcategory, error) {
	rows, err := c.DB.Query(`SELECT id, category_id, name, created_at FROM subcategories WHERE category_id = $1 ORDER BY name`, catID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var subs []Subcategory
	for rows.Next() {
		var s Subcategory
		rows.Scan(&s.ID, &s.CategoryID, &s.Name, &s.CreatedAt)
		subs = append(subs, s)
	}
	if subs == nil {
		subs = []Subcategory{}
	}
	return subs, rows.Err()
}

func (c *CategoryModule) CreateRepository(name string) (*Category, error) {
	var cat Category
	err := c.DB.QueryRow(`INSERT INTO categories (name) VALUES ($1) RETURNING id, name, created_at`, name).
		Scan(&cat.ID, &cat.Name, &cat.CreatedAt)
	return &cat, err
}

func (c *CategoryModule) CreateSubRepository(catID, name string) (*Subcategory, error) {
	var s Subcategory
	err := c.DB.QueryRow(`INSERT INTO subcategories (category_id, name) VALUES ($1, $2) RETURNING id, category_id, name, created_at`, catID, name).
		Scan(&s.ID, &s.CategoryID, &s.Name, &s.CreatedAt)
	return &s, err
}

func (c *CategoryModule) DeleteRepository(id string) error {
	_, err := c.DB.Exec(`DELETE FROM categories WHERE id = $1`, id)
	return err
}

func (c *CategoryModule) DeleteSubRepository(id string) error {
	_, err := c.DB.Exec(`DELETE FROM subcategories WHERE id = $1`, id)
	return err
}
