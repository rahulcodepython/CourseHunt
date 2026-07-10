package enrollments

import "coursehunt-backend/internals/models"

// ── Study Responses ──

type ManualEnrollRequest struct {
	UserID string `json:"user_id" validate:"required"`
}

type StudyLessonItem struct {
	ID              string `json:"id"`
	LessonNo        int    `json:"lesson_no"`
	Title           string `json:"title"`
	LessonType      string `json:"lesson_type"`
	DurationSeconds int    `json:"duration_seconds"`
	Completed       bool   `json:"completed"`
}

type ChapterProgressInfo struct {
	LessonsCompleted int  `json:"lessons_completed"`
	Completed        bool `json:"completed"`
}

type StudyChapterItem struct {
	ID                   string              `json:"id"`
	ChapterNo            int                 `json:"chapter_no"`
	Title                string              `json:"title"`
	TotalLectures        int                 `json:"total_lectures"`
	TotalDurationSeconds int                 `json:"total_duration_seconds"`
	Progress             ChapterProgressInfo `json:"progress"`
	Lessons              []StudyLessonItem   `json:"lessons"`
}

type EnrollmentStudyInfo struct {
	CompletionPercent float64 `json:"completion_percent"`
	Completed         bool    `json:"completed"`
}

type CourseStudyResponse struct {
	Course     models.CourseInfo   `json:"course"`
	Enrollment EnrollmentStudyInfo `json:"enrollment"`
	Chapters   []StudyChapterItem  `json:"chapters"`
}
