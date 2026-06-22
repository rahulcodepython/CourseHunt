package users

import "time"

type User struct {
	ID            string    `json:"id"`
	Name          string    `json:"name"`
	Email         string    `json:"email"`
	EmailVerified bool      `json:"emailVerified"`
	Image         *string   `json:"image"`
	Banned        bool      `json:"banned"`
	CreatedAt     time.Time `json:"createdAt"`
	UpdatedAt     time.Time `json:"updatedAt"`
}

type Role struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

type UserWithRoles struct {
	User
	Roles []Role `json:"roles"`
}

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
