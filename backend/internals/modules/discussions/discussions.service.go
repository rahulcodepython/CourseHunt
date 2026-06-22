package discussions

func (m *DiscussionsModule) ListByLessonService(lessonID string, page, limit int) ([]DiscussionResponse, int, error) {
	return m.ListByLessonRepository(lessonID, page, limit)
}

func (m *DiscussionsModule) ListRepliesService(parentID string, page, limit int) ([]DiscussionResponse, int, error) {
	return m.ListRepliesRepository(parentID, page, limit)
}

func (m *DiscussionsModule) CreateService(userID, lessonID, courseID string, req CreateDiscussionRequest) (*Discussion, error) {
	return m.CreateRepository(userID, lessonID, courseID, req)
}

func (m *DiscussionsModule) DeleteService(id, userID string, isAdmin bool) error {
	return m.DeleteRepository(id, userID, isAdmin)
}
