package enrollments

import (
	"coursehunt-backend/internals/models"
	"time"
)

type Enrollment struct {
	ID                   string            `json:"id"`
	UserID               models.UserInfo   `json:"user"`
	CourseID             models.CourseInfo `json:"course"`
	CompletionPercent    float64           `json:"completion_percent"`
	Completed            bool              `json:"completed"`
	LastAccessedLessonID *string           `json:"last_accessed_lesson_id"`
	Revoked              bool              `json:"revoked"`
	EnrolledAt           time.Time         `json:"enrolled_at"`
}

// ── Study Responses ──

type ManualEnrollRequest struct {
	UserID string `json:"user_id" validate:"required"`
}
