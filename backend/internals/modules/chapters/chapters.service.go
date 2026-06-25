package chapters

func (m *ChaptersModule) ListService(courseID string) ([]Chapter, error) {
	return m.ListRepository(courseID)
}

func (m *ChaptersModule) CreateService(courseID string, req CreateChapterRequest) (*Chapter, error) {
	return m.CreateRepository(courseID, req)
}

func (m *ChaptersModule) UpdateService(id string, req UpdateChapterRequest) (*Chapter, error) {
	return m.UpdateRepository(id, req)
}

func (m *ChaptersModule) DeleteService(id string) (string, error) { 
	return m.DeleteRepository(id) 
}

func (m *ChaptersModule) GetCourseIDService(chapterID string) (string, error) {
	return m.GetCourseIDByChapter(chapterID)
}
