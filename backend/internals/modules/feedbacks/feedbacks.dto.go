package feedbacks

import "time"

// ── Feedbacks ──

type CreateFeedbackRequest struct {
	Rating  int     `json:"rating" validate:"required,min=1,max=5"`
	Content *string `json:"content"`
}

// ── Feedback Response ──

type FeedbackResponse struct {
	ID        string    `json:"id"`
	CourseID  string    `json:"course_id"`
	Rating    int       `json:"rating"`
	Content   *string   `json:"content"`
	IsPinned  bool      `json:"is_pinned"`
	CreatedAt time.Time `json:"created_at"`
	User      struct {
		ID    string  `json:"id"`
		Name  string  `json:"name"`
		Image *string `json:"image"`
	} `json:"user"`
}
