package entities

import "time"

type Profile struct {
	ID            string    `json:"id" db:"id"`
	UserID        string    `json:"user_id" db:"user_id"`
	Headline      *string   `json:"headline" db:"headline"`
	Bio           *string   `json:"bio" db:"bio"`
	Website       *string   `json:"website" db:"website"`
	TotalStudents int       `json:"total_students" db:"total_students"`
	RatingAvg     float64   `json:"rating_avg" db:"rating_avg"`
	CreatedAt     time.Time `json:"created_at" db:"created_at"`
	UpdatedAt     time.Time `json:"updated_at" db:"updated_at"`
}

type UpdateProfileRequest struct {
	Headline *string `json:"headline" validate:"omitempty,max=200"`
	Bio      *string `json:"bio" validate:"omitempty,max=1000"`
	Website  *string `json:"website" validate:"omitempty,max=500,url"`
}

type AdminProfileItem struct {
	ID            string    `json:"id" db:"id"`
	UserID        string    `json:"user_id" db:"user_id"`
	Email         string    `json:"email" db:"email"`
	Name          string    `json:"name" db:"name"`
	Role          string    `json:"role" db:"role"`
	Headline      *string   `json:"headline" db:"headline"`
	Bio           *string   `json:"bio" db:"bio"`
	Website       *string   `json:"website" db:"website"`
	TotalStudents *int      `json:"total_students" db:"total_students"`
	RatingAvg     *float64  `json:"rating_avg" db:"rating_avg"`
	UpdatedAt     time.Time `json:"updated_at" db:"updated_at"`
}
