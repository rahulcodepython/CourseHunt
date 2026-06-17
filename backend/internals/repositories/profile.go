package repositories

import (
	"database/sql"

	"coursehunt-backend/internals/database"
	"coursehunt-backend/internals/models"
)

type ProfileRepository struct{ DB *sql.DB }

func NewProfileRepository() *ProfileRepository { return &ProfileRepository{DB: database.DB} }

func (r *ProfileRepository) GetUser(userID string) (*models.UserProfile, error) {
	var p models.UserProfile
	err := r.DB.QueryRow(`SELECT id, user_id, headline, bio, website, updated_at FROM user_profile WHERE user_id = $1`, userID).
		Scan(&p.ID, &p.UserID, &p.Headline, &p.Bio, &p.Website, &p.UpdatedAt)
	return &p, err
}

func (r *ProfileRepository) GetTutor(userID string) (*models.TutorProfile, error) {
	var p models.TutorProfile
	err := r.DB.QueryRow(`SELECT id, user_id, headline, bio, website, total_students, rating_avg, updated_at FROM tutor_profile WHERE user_id = $1`, userID).
		Scan(&p.ID, &p.UserID, &p.Headline, &p.Bio, &p.Website, &p.TotalStudents, &p.RatingAvg, &p.UpdatedAt)
	return &p, err
}

func (r *ProfileRepository) UpsertUserProfile(userID string, req models.UpdateProfileRequest) (*models.UserProfile, error) {
	var p models.UserProfile
	err := r.DB.QueryRow(`
		INSERT INTO user_profile (user_id, headline, bio, website, updated_at)
		VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
		ON CONFLICT (user_id) DO UPDATE SET headline = $2, bio = $3, website = $4, updated_at = CURRENT_TIMESTAMP
		RETURNING id, user_id, headline, bio, website, updated_at`,
		userID, req.Headline, req.Bio, req.Website,
	).Scan(&p.ID, &p.UserID, &p.Headline, &p.Bio, &p.Website, &p.UpdatedAt)
	return &p, err
}

func (r *ProfileRepository) UpsertTutorProfile(userID string, req models.UpdateProfileRequest) (*models.TutorProfile, error) {
	var p models.TutorProfile
	err := r.DB.QueryRow(`
		INSERT INTO tutor_profile (user_id, headline, bio, website, updated_at)
		VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
		ON CONFLICT (user_id) DO UPDATE SET headline = $2, bio = $3, website = $4, updated_at = CURRENT_TIMESTAMP
		RETURNING id, user_id, headline, bio, website, total_students, rating_avg, updated_at`,
		userID, req.Headline, req.Bio, req.Website,
	).Scan(&p.ID, &p.UserID, &p.Headline, &p.Bio, &p.Website, &p.TotalStudents, &p.RatingAvg, &p.UpdatedAt)
	return &p, err
}
