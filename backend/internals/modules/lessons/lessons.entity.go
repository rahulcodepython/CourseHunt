package lessons

import (
	"coursehunt-backend/internals/modules/quiz"
	"time"
)

type Lesson struct {
	ID               string    `json:"id" db:"id"`
	ChapterID        string    `json:"chapter_id" db:"chapter_id"`
	LessonNo         int       `json:"lesson_no" db:"lesson_no"`
	Title            string    `json:"title" db:"title"`
	LessonType       string    `json:"lesson_type" db:"lesson_type"`
	ShortDescription *string   `json:"short_description" db:"short_description"`
	PreviewVideoURL  *string   `json:"preview_video_url" db:"preview_video_url"`
	DurationSeconds  int       `json:"duration_seconds" db:"duration_seconds"`
	CreatedAt        time.Time `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time `json:"updated_at" db:"updated_at"`
}

type LessonVideoContent struct {
	ID             string  `json:"id" db:"id"`
	VideoURL       string  `json:"video_url" db:"video_url"`
	WrittenContent *string `json:"written_content" db:"written_content"`
}

type LessonDocumentContent struct {
	ID      string `json:"id" db:"id"`
	Content string `json:"content" db:"content"`
}

type LessonResource struct {
	ID       string  `json:"id" db:"id"`
	Title    string  `json:"title" db:"title"`
	FileURL  string  `json:"file_url" db:"file_url"`
	FileType *string `json:"file_type" db:"file_type"`
}

// ── Lessons ──

type CreateLessonRequest struct {
	Title            string  `json:"title" validate:"required,min=2,max=200"`
	LessonNo         int     `json:"lesson_no" validate:"required,min=1"`
	LessonType       string  `json:"lesson_type" validate:"required,oneof=video document quiz"`
	ShortDescription *string `json:"short_description"`
	PreviewVideoURL  *string `json:"preview_video_url"`
	DurationSeconds  int     `json:"duration_seconds" validate:"min=0"`
}

type UpdateLessonRequest struct {
	Title            *string `json:"title" validate:"omitempty,min=2,max=200"`
	LessonNo         *int    `json:"lesson_no" validate:"omitempty,min=1"`
	ShortDescription *string `json:"short_description"`
	PreviewVideoURL  *string `json:"preview_video_url"`
	DurationSeconds  *int    `json:"duration_seconds" validate:"omitempty,min=0"`
}

type UpsertVideoContentRequest struct {
	VideoURL       string  `json:"video_url" validate:"required,url"`
	WrittenContent *string `json:"written_content"`
}

type UpsertDocumentContentRequest struct {
	Content string `json:"content" validate:"required"`
}

type AddResourceRequest struct {
	Title    string  `json:"title" validate:"required,min=1,max=200"`
	FileURL  string  `json:"file_url" validate:"required,url"`
	FileType *string `json:"file_type"`
}

type AllowedContent interface {
	LessonVideoContent | LessonDocumentContent | quiz.QuizMetadata
}

type LessonContentResponse[T AllowedContent] struct {
	Content *T `json:"content"`
}

type SignedURLResponse struct {
	URL string `json:"url"`
}

type LessonCompleteResponse struct {
	LessonID  string `json:"lesson_id"`
	Completed bool   `json:"completed"`
}

type AggregatedLessonContentResponse struct {
	LessonType      string                 `json:"lesson_type"`
	VideoContent    *LessonVideoContent    `json:"video_content"`
	DocumentContent *LessonDocumentContent `json:"document_content"`
	QuizContent     *quiz.QuizMetadata     `json:"quiz_content"`
}
