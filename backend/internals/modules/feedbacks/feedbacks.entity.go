package feedbacks

import (
	"coursehunt-backend/internals/models"
	"time"
)

type Feedback struct {
	ID        string            `json:"id"`
	Course    models.CourseInfo `json:"course"`
	User      models.UserInfo   `json:"user"`
	Rating    int               `json:"rating"`
	Content   *string           `json:"content"`
	IsPinned  bool              `json:"is_pinned"`
	CreatedAt time.Time         `json:"created_at"`
}
