package category

func (c *CategoryModule) ListService() ([]CategoryWithSubs, error) {
	return c.ListRepository()
}

func (c *CategoryModule) CreateService(req CreateCategoryRequest) (*Category, error) {
	return c.CreateRepository(req.Name)
}

func (c *CategoryModule) CreateSubService(catID string, req CreateSubcategoryRequest) (*Subcategory, error) {
	return c.CreateSubRepository(catID, req.Name)
}

func (c *CategoryModule) DeleteService(id string) (string, error) {
	return c.DeleteRepository(id)
}

func (c *CategoryModule) DeleteSubService(id string) (string, error) {
	return c.DeleteSubRepository(id)
}
