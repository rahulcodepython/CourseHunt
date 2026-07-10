package enrollments

func (m *EnrollmentsModule) EnrollRepository(userID, courseID string) (*Enrollment, error) {
	var e Enrollment
	err := m.DB.QueryRow(`
		INSERT INTO enrollments (user_id, course_id)
		VALUES ($1, $2)
		ON CONFLICT (user_id, course_id) DO UPDATE SET revoked = false
		RETURNING id, user_id, course_id, completion_percent, completed, last_accessed_lesson_id, revoked, enrolled_at`,
		userID, courseID).Scan(&e.ID, &e.UserID.ID, &e.CourseID.ID, &e.CompletionPercent, &e.Completed, &e.LastAccessedLessonID, &e.Revoked, &e.EnrolledAt)
	return &e, err
}

func (m *EnrollmentsModule) RevokeRepository(userID, courseID string) error {
	_, err := m.DB.Exec(`UPDATE enrollments SET revoked = true WHERE user_id = $1 AND course_id = $2`, userID, courseID)
	return err
}

func (m *EnrollmentsModule) IsEnrolledRepository(userID, courseID string) bool {
	var exists bool
	m.DB.QueryRow(`SELECT EXISTS(SELECT 1 FROM enrollments WHERE user_id = $1 AND course_id = $2 AND revoked = false)`, userID, courseID).Scan(&exists)
	return exists
}

func (m *EnrollmentsModule) ListRepository(page, limit int) ([]Enrollment, int, error) {
	var total int
	m.DB.QueryRow(`SELECT COUNT(*) FROM enrollments`).Scan(&total)
	offset := (page - 1) * limit
	rows, err := m.DB.Query(`
		SELECT id, user_id, course_id, completion_percent, completed, last_accessed_lesson_id, revoked, enrolled_at
		FROM enrollments ORDER BY enrolled_at DESC LIMIT $1 OFFSET $2`, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	var list []Enrollment
	for rows.Next() {
		var e Enrollment
		rows.Scan(&e.ID, &e.UserID.ID, &e.CourseID.ID, &e.CompletionPercent, &e.Completed, &e.LastAccessedLessonID, &e.Revoked, &e.EnrolledAt)
		list = append(list, e)
	}
	if list == nil {
		list = []Enrollment{}
	}
	return list, total, rows.Err()
}
