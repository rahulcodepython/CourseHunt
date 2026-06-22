package lessons

import (
	"database/sql"
	"time"
)

type Lesson struct {
	ID               string         `json:"id"`
	ChapterID        string         `json:"chapter_id"`
	LessonNo         int            `json:"lesson_no"`
	Title            string         `json:"title"`
	LessonType       string         `json:"lesson_type"`
	ShortDescription sql.NullString `json:"-"`
	PreviewVideoURL  sql.NullString `json:"-"`
	DurationSeconds  int            `json:"duration_seconds"`
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`
}

type LessonVideoContent struct {
	ID             string  `json:"id"`
	LessonID       string  `json:"lesson_id"`
	VideoURL       string  `json:"video_url"`
	WrittenContent *string `json:"written_content"`
}

type LessonDocumentContent struct {
	ID       string `json:"id"`
	LessonID string `json:"lesson_id"`
	Content  string `json:"content"`
}

type LessonResource struct {
	ID       string  `json:"id"`
	LessonID string  `json:"lesson_id"`
	Title    string  `json:"title"`
	FileURL  string  `json:"file_url"`
	FileType *string `json:"file_type"`
}
