package certificate

import "time"

// ── Certificate Response ──

type CertificateResponse struct {
	ID          string    `json:"id"`
	UserID      string    `json:"user_id"`
	CourseID    string    `json:"course_id"`
	CourseTitle string    `json:"course_title"`
	IssuedAt    time.Time `json:"issued_at"`
}
