package cart

func (c *CartModule) AddService(userID, courseID string) (*CartItem, error) {
	return c.AddRepository(userID, courseID)
}
func (c *CartModule) RemoveService(userID, courseID string) error {
	return c.RemoveRepository(userID, courseID)
}
func (c *CartModule) ListService(userID string) ([]CartItem, error) {
	return c.ListRepository(userID)
}
func (c *CartModule) ClearService(userID string) error {
	return c.ClearRepository(userID)
}
