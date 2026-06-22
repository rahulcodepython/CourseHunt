package profile

import "coursehunt-backend/internals/modules/users"

func (m *ProfileModule) ReadUserProfileRepository(userID string) (*users.UserProfile, error) {
	var p users.UserProfile
	err := m.DB.QueryRow(`SELECT id, user_id, headline, bio, website, updated_at FROM user_profile WHERE user_id = $1`, userID).
		Scan(&p.ID, &p.UserID, &p.Headline, &p.Bio, &p.Website, &p.UpdatedAt)
	return &p, err
}

func (m *ProfileModule) ReadTutorProfileRepository(userID string) (*users.TutorProfile, error) {
	var p users.TutorProfile
	err := m.DB.QueryRow(`SELECT id, user_id, headline, bio, website, total_students, rating_avg, updated_at FROM tutor_profile WHERE user_id = $1`, userID).
		Scan(&p.ID, &p.UserID, &p.Headline, &p.Bio, &p.Website, &p.TotalStudents, &p.RatingAvg, &p.UpdatedAt)
	return &p, err
}

func (m *ProfileModule) UpsertUserProfileRepository(userID string, req UpdateProfileRequest) (*users.UserProfile, error) {
	var p users.UserProfile
	err := m.DB.QueryRow(`
		INSERT INTO user_profile (user_id, headline, bio, website, updated_at)
		VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
		ON CONFLICT (user_id) DO UPDATE SET headline = $2, bio = $3, website = $4, updated_at = CURRENT_TIMESTAMP
		RETURNING id, user_id, headline, bio, website, updated_at`,
		userID, req.Headline, req.Bio, req.Website,
	).Scan(&p.ID, &p.UserID, &p.Headline, &p.Bio, &p.Website, &p.UpdatedAt)
	return &p, err
}

func (m *ProfileModule) UpsertTutorProfileRepository(userID string, req UpdateProfileRequest) (*users.TutorProfile, error) {
	var p users.TutorProfile
	err := m.DB.QueryRow(`
		INSERT INTO tutor_profile (user_id, headline, bio, website, updated_at)
		VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
		ON CONFLICT (user_id) DO UPDATE SET headline = $2, bio = $3, website = $4, updated_at = CURRENT_TIMESTAMP
		RETURNING id, user_id, headline, bio, website, total_students, rating_avg, updated_at`,
		userID, req.Headline, req.Bio, req.Website,
	).Scan(&p.ID, &p.UserID, &p.Headline, &p.Bio, &p.Website, &p.TotalStudents, &p.RatingAvg, &p.UpdatedAt)
	return &p, err
}
