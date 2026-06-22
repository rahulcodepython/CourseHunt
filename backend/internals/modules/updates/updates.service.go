package updates

func (m *UpdatesModule) CreateService(createdBy string, req CreateUpdateRequest) (*CourseUpdate, error) {
	return m.CreateRepository(createdBy, req)
}
func (m *UpdatesModule) UpdateService(id, message string) (*CourseUpdate, error) {
	return m.UpdateRepository(id, message)
}
func (m *UpdatesModule) DeleteService(id string) error { 
	return m.DeleteRepository(id) 
}
func (m *UpdatesModule) FeedService(userID string, page, limit int) (*UpdateFeedResponse, error) {
	return m.FeedRepository(userID, page, limit)
}
func (m *UpdatesModule) ListService(page, limit int) ([]CourseUpdate, int, error) {
	return m.ListRepository(page, limit)
}
