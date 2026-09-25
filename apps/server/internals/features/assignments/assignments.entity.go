package assignments

import (
	"time"
)

type Assignment struct {
	ID           string    `json:"id" db:"id"`
	LessonID     string    `json:"lesson_id" db:"lesson_id"`
	Title        string    `json:"title" db:"title"`
	Instructions string    `json:"instructions" db:"instructions"`
	MaxScore     int       `json:"max_score" db:"max_score"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time `json:"updated_at" db:"updated_at"`
}

type AssignmentSubmission struct {
	ID            string     `json:"id" db:"id"`
	AssignmentID  string     `json:"assignment_id" db:"assignment_id"`
	UserID        string     `json:"user_id" db:"user_id"`
	UserEmail     *string    `json:"user_email,omitempty" db:"user_email"`
	UserName      *string    `json:"user_name,omitempty" db:"user_name"`
	FileURL       string     `json:"file_url" db:"file_url"`
	Score         *int       `json:"score" db:"score"`
	FeedbackNotes *string    `json:"feedback_notes" db:"feedback_notes"`
	GradedBy      *string    `json:"graded_by" db:"graded_by"`
	Status        string     `json:"status" db:"status"`
	SubmittedAt   time.Time  `json:"submitted_at" db:"submitted_at"`
	GradedAt      *time.Time `json:"graded_at" db:"graded_at"`
}

type CreateAssignmentRequest struct {
	Title        string `json:"title" validate:"required,min=2,max=200"`
	Instructions string `json:"instructions" validate:"required,min=5,max=50000"`
	MaxScore     int    `json:"max_score" validate:"min=1,max=1000"`
}

type SubmitAssignmentRequest struct {
	FileURL string `json:"file_url" validate:"required,url"`
}

type GradeSubmissionRequest struct {
	Score         int    `json:"score" validate:"min=0,max=1000"`
	FeedbackNotes string `json:"feedback_notes" validate:"omitempty,max=5000"`
}
