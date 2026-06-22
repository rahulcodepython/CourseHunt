package enrollments

func (m *EnrollmentsModule) CreateService(userID, courseID string) error {
	return m.EnrollRepository(userID, courseID)
}

func (m *EnrollmentsModule) ListService(page, limit int) ([]Enrollment, int, error) {
	return m.ListRepository(page, limit)
}
