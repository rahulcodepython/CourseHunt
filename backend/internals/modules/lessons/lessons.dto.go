package lessons

import "coursehunt-backend/internals/modules/quiz"

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

// ── Lesson Content Responses ──

type LessonContentInfo struct {
	ID         string `json:"id"`
	Title      string `json:"title"`
	LessonType string `json:"lesson_type"`
	LessonNo   int    `json:"lesson_no"`
	ChapterID  string `json:"chapter_id"`
}

type LessonBodyContent struct {
	// video
	VideoURL       *string `json:"video_url,omitempty"`
	WrittenContent *string `json:"written_content,omitempty"`
	// document
	DocumentContent *string `json:"content,omitempty"`
	// quiz
	QuizMetadata *quiz.QuizMetadata `json:"quiz_metadata,omitempty"`
}

type LessonUserNoteInfo struct {
	Content *string `json:"content"`
}

type LessonContentResponse struct {
	Lesson    LessonContentInfo  `json:"lesson"`
	Content   LessonBodyContent  `json:"content"`
	Resources []LessonResource   `json:"resources"`
	UserNote  LessonUserNoteInfo `json:"user_note"`
	Completed bool               `json:"completed"`
}

type SignedURLResponse struct {
	URL string `json:"url"`
}

type LessonCompleteResponse struct {
	LessonID  string `json:"lesson_id"`
	Completed bool   `json:"completed"`
}
