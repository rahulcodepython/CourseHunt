package wishlist

func (m *WishlistModule) CreateService(userID, courseID string) (*Wishlist, error) {
	return m.CreateRepository(userID, courseID)
}

func (m *WishlistModule) DeleteService(userID, courseID string) error {
	return m.DeleteRepository(userID, courseID)
}

func (m *WishlistModule) ListService(userID string) ([]Wishlist, error) {
	return m.ListRepository(userID)
}
