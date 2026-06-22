package updates

import "time"

type CourseUpdate struct {
	ID        string    `json:"id"`
	CourseID  *string   `json:"course_id"`
	CreatedBy *string   `json:"created_by"`
	Message   string    `json:"message"`
	CreatedAt time.Time `json:"created_at"`
}
