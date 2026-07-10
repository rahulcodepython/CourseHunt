package certificate

import (
	"coursehunt-backend/internals/models"
	"time"
)

type Certificate struct {
	ID       string            `json:"id"`
	UserID   string            `json:"user_id"`
	Course   models.CourseInfo `json:"course"`
	IssuedAt time.Time         `json:"issued_at"`
}

// ── Certificate Response ──

type CertificateResponse struct {
	ID          string    `json:"id"`
	UserID      string    `json:"user_id"`
	CourseID    string    `json:"course_id"`
	CourseTitle string    `json:"course_title"`
	IssuedAt    time.Time `json:"issued_at"`
}
