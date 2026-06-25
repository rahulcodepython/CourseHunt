package notes

func (m *NotesModule) UpsertService(userID, lessonID, courseID, content string) (*NoteResponse, error) {
	return m.UpsertRepository(userID, lessonID, courseID, content)
}

func (m *NotesModule) ReadService(userID, lessonID string) (*UserNote, error) {
	return m.ReadRepository(userID, lessonID)
}

func (m *NotesModule) UpdateService(id, userID, content string) (*NoteResponse, error) {
	return m.UpdateRepository(id, userID, content)
}

func (m *NotesModule) DeleteService(id, userID string) (string, error) {
	return m.DeleteRepository(id, userID)
}
