package notes

func (m *NotesModule) UpsertService(userID, lessonID, courseID, content string) (*NoteResponse, error) {
	return m.UpsertRepository(userID, lessonID, courseID, content)
}

func (m *NotesModule) ReadService(userID, lessonID string) (*UserNote, error) {
	return m.ReadRepository(userID, lessonID)
}
