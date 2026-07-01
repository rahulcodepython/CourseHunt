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
