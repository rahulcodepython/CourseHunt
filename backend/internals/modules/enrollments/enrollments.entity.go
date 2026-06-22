package enrollments

import "time"

type Enrollment struct {
	ID                   string    `json:"id"`
	UserID               string    `json:"user_id"`
	CourseID             string    `json:"course_id"`
	CompletionPercent    float64   `json:"completion_percent"`
	Completed            bool      `json:"completed"`
	LastAccessedLessonID *string   `json:"last_accessed_lesson_id"`
	Revoked              bool      `json:"revoked"`
	EnrolledAt           time.Time `json:"enrolled_at"`
}

type LessonProgress struct {
	ID          string     `json:"id"`
	UserID      string     `json:"user_id"`
	LessonID    string     `json:"lesson_id"`
	CourseID    string     `json:"course_id"`
	Completed   bool       `json:"completed"`
	CompletedAt *time.Time `json:"completed_at"`
}

type ChapterProgress struct {
	ID               string `json:"id"`
	UserID           string `json:"user_id"`
	ChapterID        string `json:"chapter_id"`
	CourseID         string `json:"course_id"`
	LessonsCompleted int    `json:"lessons_completed"`
	Completed        bool   `json:"completed"`
}
