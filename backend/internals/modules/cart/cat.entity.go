package cart

import "time"

type CartItem struct {
	ID              string    `json:"id"`
	UserID          string    `json:"user_id"`
	CourseID        string    `json:"course_id"`
	CourseName      string    `json:"course_name"`
	CourseThumbnail string    `json:"course_thumbnail"`
	AddedAt         time.Time `json:"added_at"`
}
