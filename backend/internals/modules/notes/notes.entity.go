package notes

import (
	"time"
)

type UserNote struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	LessonID  string    `json:"lesson_id"`
	CourseID  string    `json:"course_id"`
	Content   string    `json:"content"`
	UpdatedAt time.Time `json:"updated_at"`
}

// ── Notes ──

type UpsertNoteRequest struct {
	Content string `json:"content" validate:"required,min=1"`
}

// ── Note Response ──

type NoteResponse struct {
	ID        string    `json:"id"`
	Content   string    `json:"content"`
	UpdatedAt time.Time `json:"updated_at"`
}
