package feedbacks

func (m *FeedbacksModule) CreateService(userID, courseID string, req CreateFeedbackRequest) (*Feedback, error) {
	return m.CreateRepository(userID, courseID, req)
}
func (m *FeedbacksModule) ListService(courseID string, page, limit int) ([]FeedbackResponse, int, error) {
	return m.ListRepository(courseID, page, limit)
}
func (m *FeedbacksModule) UpdateService(id string, pin bool) error { 
	return m.UpdateRepository(id, pin) 
}
func (m *FeedbacksModule) DeleteService(id string) error { 
	return m.DeleteRepository(id) 
}
