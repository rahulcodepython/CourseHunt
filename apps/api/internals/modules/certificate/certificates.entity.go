package certificate

import (
	"coursehunt/api/internals/models"
	"time"
)

type Certificate struct {
	ID       string            `json:"id" db:"id"`
	UserID   string            `json:"user_id" db:"user_id"`
	Course   models.CourseInfo `json:"course" db:""`
	IssuedAt time.Time         `json:"issued_at" db:"issued_at"`
}
