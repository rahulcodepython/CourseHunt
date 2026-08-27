package entities

import (
	"time"
)

type Faq struct {
	ID        string    `json:"id" db:"id"`
	CourseID  string    `json:"course_id" db:"course_id"`
	Question  string    `json:"question" db:"question"`
	Answer    string    `json:"answer" db:"answer"`
	SortOrder int       `json:"sort_order" db:"sort_order"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

// ── FAQs ──

// course_id comes from the ?course_id= query param, not the body (mirrors
// CreateChapterRequest's pattern).
type CreateFaqRequest struct {
	Question string `json:"question" validate:"required,min=3,max=500"`
	Answer   string `json:"answer" validate:"required,min=1"`
}

// sort_order is auto-incremented server-side (next after the course's
// highest existing sort_order) — never client-settable.
type UpdateFaqRequest struct {
	Question *string `json:"question" validate:"omitempty,min=3,max=500"`
	Answer   *string `json:"answer" validate:"omitempty,min=1"`
}
