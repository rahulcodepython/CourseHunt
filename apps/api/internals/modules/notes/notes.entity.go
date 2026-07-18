package notes

import (
	"time"
)

type UserNote struct {
	ID        string    `json:"id" db:"id"`
	UserID    string    `json:"user_id" db:"user_id"`
	LessonID  string    `json:"lesson_id" db:"lesson_id"`
	CourseID  string    `json:"course_id" db:"course_id"`
	Content   string    `json:"content" db:"content"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

type UpsertNoteRequest struct {
	Content string `json:"content" validate:"required,min=1"`
}

type NoteResponse struct {
	ID        string    `json:"id" db:"id"`
	Content   string    `json:"content" db:"content"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}
