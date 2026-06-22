package feedbacks

import "time"

type Feedback struct {
	ID        string    `json:"id"`
	CourseID  string    `json:"course_id"`
	UserID    string    `json:"user_id"`
	Rating    int       `json:"rating"`
	Content   *string   `json:"content"`
	IsPinned  bool      `json:"is_pinned"`
	CreatedAt time.Time `json:"created_at"`
}
