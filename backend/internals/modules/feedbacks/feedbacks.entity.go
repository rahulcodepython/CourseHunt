package feedbacks

import (
	"coursehunt-backend/internals/models"
	"time"
)

type Feedback struct {
	ID        string            `json:"id" db:"id"`
	Course    models.CourseInfo `json:"course" db:""`
	User      models.UserInfo   `json:"user" db:""`
	Rating    int               `json:"rating" db:"rating"`
	Content   *string           `json:"content" db:"content"`
	IsPinned  bool              `json:"is_pinned" db:"is_pinned"`
	CreatedAt time.Time         `json:"created_at" db:"created_at"`
}

type CreateFeedbackRequest struct {
	Rating   int     `json:"rating" validate:"required,min=1,max=5"`
	Content  *string `json:"content"`
	CourseID string  `json:"course_id"`
}

type PinFeedbackRequest struct {
	IsPinned bool `json:"is_pinned"`
}
