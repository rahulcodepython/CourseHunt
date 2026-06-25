package profile

func (m *ProfileModule) ReadUserProfileService(userID string) (*UserProfile, error) {
	return m.ReadUserProfileRepository(userID)
}

func (m *ProfileModule) ReadTutorProfileService(userID string) (*TutorProfile, error) {
	return m.ReadTutorProfileRepository(userID)
}

func (m *ProfileModule) UpsertUserProfileService(userID string, req UpdateProfileRequest) (*UserProfile, error) {
	return m.UpsertUserProfileRepository(userID, req)
}

func (m *ProfileModule) UpsertTutorProfileService(userID string, req UpdateProfileRequest) (*TutorProfile, error) {
	return m.UpsertTutorProfileRepository(userID, req)
}
