package profile

import "coursehunt-backend/internals/modules/users"

func (m *ProfileModule) ReadUserProfileService(userID string) (*users.UserProfile, error) {
	return m.ReadUserProfileRepository(userID)
}

func (m *ProfileModule) ReadTutorProfileService(userID string) (*users.TutorProfile, error) {
	return m.ReadTutorProfileRepository(userID)
}

func (m *ProfileModule) UpsertUserProfileService(userID string, req UpdateProfileRequest) (*users.UserProfile, error) {
	return m.UpsertUserProfileRepository(userID, req)
}

func (m *ProfileModule) UpsertTutorProfileService(userID string, req UpdateProfileRequest) (*users.TutorProfile, error) {
	return m.UpsertTutorProfileRepository(userID, req)
}
