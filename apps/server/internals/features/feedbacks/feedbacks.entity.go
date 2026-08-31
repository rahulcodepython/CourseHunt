package feedbacks

import (
	"time"

	"coursehunt/server/internals/generic"
)

type Feedback struct {
	ID        string             `json:"id" db:"id"`
	Course    generic.CourseInfo `json:"course" db:"course"`
	User      generic.UserInfo   `json:"user" db:"user"`
	Rating    int                `json:"rating" db:"rating"`
	Content   *string            `json:"content" db:"content"`
	IsPinned  bool               `json:"is_pinned" db:"is_pinned"`
	CreatedAt time.Time          `json:"created_at" db:"created_at"`
}

type CreateFeedbackRequest struct {
	Rating   int     `json:"rating" validate:"required,min=1,max=5"`
	Content  *string `json:"content" validate:"omitempty,max=2000"`
	CourseID string  `json:"course_id" validate:"required,uuid"`
}

type PinFeedbackRequest struct {
	IsPinned bool `json:"is_pinned"`
}
