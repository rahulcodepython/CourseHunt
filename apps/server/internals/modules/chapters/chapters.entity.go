package chapters

import (
	"time"
)

type Chapter struct {
	ID                   string    `json:"id" db:"id"`
	CourseID             string    `json:"course_id" db:"course_id"`
	ChapterNo            int       `json:"chapter_no" db:"chapter_no"`
	Title                string    `json:"title" db:"title"`
	TotalLectures        int       `json:"total_lectures" db:"total_lectures"`
	TotalDurationSeconds int       `json:"total_duration_seconds" db:"total_duration_seconds"`
	CreatedAt            time.Time `json:"created_at" db:"created_at"`
	UpdatedAt            time.Time `json:"updated_at" db:"updated_at"`
}

// ── Chapters ──

type CreateChapterRequest struct {
	Title     string `json:"title" validate:"required,min=2,max=200"`
	ChapterNo int    `json:"chapter_no" validate:"required,min=1"`
	CourseID  string `json:"course_id" validate:"required"`
}

type UpdateChapterRequest struct {
	Title     *string `json:"title" validate:"omitempty,min=2,max=200"`
	ChapterNo *int    `json:"chapter_no" validate:"omitempty,min=1"`
}
