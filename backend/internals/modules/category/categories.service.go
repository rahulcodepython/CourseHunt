package category

func (c *CategoryModule) ListService() ([]Category, error) {
	return c.ListRepository()
}

func (c *CategoryModule) CreateService(req CreateCategoryRequest) (*Category, error) {
	return c.CreateRepository(req.Name, req.ParentID)
}

func (c *CategoryModule) UpdateService(id string, req UpdateCategoryRequest) (*Category, error) {
	return c.UpdateRepository(id, req.Name)
}

func (c *CategoryModule) DeleteService(id string) (string, error) {
	return c.DeleteRepository(id)
}
