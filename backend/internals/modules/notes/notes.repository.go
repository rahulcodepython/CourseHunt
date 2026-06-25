package notes

func (m *NotesModule) UpsertRepository(userID, lessonID, courseID, content string) (*NoteResponse, error) {
	var n NoteResponse
	err := m.DB.QueryRow(`
		INSERT INTO user_notes (user_id, lesson_id, course_id, content, updated_at)
		VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
		ON CONFLICT (user_id, lesson_id) DO UPDATE SET content = $4, updated_at = CURRENT_TIMESTAMP
		RETURNING id, content, updated_at`,
		userID, lessonID, courseID, content,
	).Scan(&n.ID, &n.Content, &n.UpdatedAt)
	return &n, err
}

func (m *NotesModule) ReadRepository(userID, lessonID string) (*UserNote, error) {
	var n UserNote
	err := m.DB.QueryRow(`SELECT id, user_id, lesson_id, course_id, content, updated_at FROM user_notes WHERE user_id = $1 AND lesson_id = $2`, userID, lessonID).
		Scan(&n.ID, &n.UserID, &n.LessonID, &n.CourseID, &n.Content, &n.UpdatedAt)
	return &n, err
}

func (m *NotesModule) UpdateRepository(id, userID, content string) (*NoteResponse, error) {
	var n NoteResponse
	err := m.DB.QueryRow(`
		UPDATE user_notes SET content = $1, updated_at = CURRENT_TIMESTAMP
		WHERE id = $2 AND user_id = $3
		RETURNING id, content, updated_at`,
		content, id, userID,
	).Scan(&n.ID, &n.Content, &n.UpdatedAt)
	return &n, err
}

func (m *NotesModule) DeleteRepository(id, userID string) (string, error) {
	var deletedID string
	err := m.DB.QueryRow(`DELETE FROM user_notes WHERE id = $1 AND user_id = $2 RETURNING id`, id, userID).Scan(&deletedID)
	return deletedID, err
}
