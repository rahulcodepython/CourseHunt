package profile

import (
	"time"
)

type UserProfile struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	Headline  *string   `json:"headline"`
	Bio       *string   `json:"bio"`
	Website   *string   `json:"website"`
	UpdatedAt time.Time `json:"updated_at"`
}

type TutorProfile struct {
	ID            string    `json:"id"`
	UserID        string    `json:"user_id"`
	Headline      *string   `json:"headline"`
	Bio           *string   `json:"bio"`
	Website       *string   `json:"website"`
	TotalStudents int       `json:"total_students"`
	RatingAvg     float64   `json:"rating_avg"`
	UpdatedAt     time.Time `json:"updated_at"`
}

// ── Auth / Profile ──

type UpdateProfileRequest struct {
	Headline *string `json:"headline"`
	Bio      *string `json:"bio"`
	Website  *string `json:"website"`
}
