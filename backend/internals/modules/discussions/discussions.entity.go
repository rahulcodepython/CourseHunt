package discussions

import (
	"coursehunt-backend/internals/models"
	"time"
)

type Discussion struct {
	ID         string          `json:"id" db:"id"`
	LessonID   string          `json:"lesson_id" db:"lesson_id"`
	CourseID   string          `json:"course_id" db:"course_id"`
	User       models.UserInfo `json:"user" db:""`
	ParentID   *string         `json:"parent_id" db:"parent_id"`
	Content    string          `json:"content" db:"content"`
	Depth      int             `json:"depth" db:"depth"`
	ReplyCount int             `json:"reply_count" db:"reply_count"`
	CreatedAt  time.Time       `json:"created_at" db:"created_at"`
	UpdatedAt  time.Time       `json:"updated_at" db:"updated_at"`
}

type CreateDiscussionRequest struct {
	Content  string  `json:"content" validate:"required,min=1,max=5000"`
	ParentID *string `json:"parent_id" validate:"omitempty,uuid"`
	LessonID string  `json:"lesson_id" validate:"uuid"`
}

type UpdateDiscussionRequest struct {
	Content string `json:"content" validate:"required,min=1,max=5000"`
}
