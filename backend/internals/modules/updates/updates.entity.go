package updates

import (
	"coursehunt-backend/internals/models"
	"time"
)

type CourseUpdate struct {
	ID        string            `json:"id"`
	Course    models.CourseInfo `json:"course"`
	CreatedBy *string           `json:"created_by"`
	Message   string            `json:"message"`
	CreatedAt time.Time         `json:"created_at"`
}
