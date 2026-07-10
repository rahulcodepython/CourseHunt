package courses

func (m *CoursesModule) CreateService(tutorID string, req CreateCourseRequest) (*CourseCreatedResponse, error) {
	return m.CreateRepository(tutorID, req)
}

func (m *CoursesModule) UpdateService(id string, req UpdateCourseRequest) (*Course, error) {
	return m.UpdateRepository(id, req)
}

func (m *CoursesModule) DeleteService(id string) (string, error) {
	return m.DeleteRepository(id)
}

// ListService returns a paginated list of courses with enriched card data.
func (m *CoursesModule) ListService(page, limit int, categoryID, level, search, tutorID, status string) ([]CourseCardResponse, int, error) {
	cards, total, err := m.ListRepository(page, limit, categoryID, level, search, tutorID, status)
	if err != nil {
		return nil, 0, err
	}
	return cards, total, nil
}

func (m *CoursesModule) ReadLandingService(slug, userID string) (*CourseLandingResponse, error) {
	resp, err := m.ReadLandingBySlugRepository(slug, userID)
	if err != nil {
		return nil, err
	}
	return resp, nil
}

// ReadStudyMetadataService returns the study page metadata for enrolled users.
func (m *CoursesModule) ReadStudyMetadataService(courseID, userID string) (*CourseStudyResponse, error) {
	resp, err := m.ReadStudyMetadataRepository(courseID, userID)
	if err != nil {
		return nil, err
	}
	return resp, nil
}

func (m *CoursesModule) EnrolledCoursesService(userID string) ([]EnrolledCourseResponse, error) {
	return m.EnrolledCoursesRepository(userID)
}
