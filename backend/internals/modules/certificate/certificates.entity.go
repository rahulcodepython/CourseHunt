package certificate

import "time"

type Certificate struct {
	ID       string    `json:"id"`
	UserID   string    `json:"user_id"`
	CourseID string    `json:"course_id"`
	IssuedAt time.Time `json:"issued_at"`
}
