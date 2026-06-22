package chapters

import "time"

type Chapter struct {
	ID                   string    `json:"id"`
	CourseID             string    `json:"course_id"`
	ChapterNo            int       `json:"chapter_no"`
	Title                string    `json:"title"`
	TotalLectures        int       `json:"total_lectures"`
	TotalDurationSeconds int       `json:"total_duration_seconds"`
	CreatedAt            time.Time `json:"created_at"`
	UpdatedAt            time.Time `json:"updated_at"`
}
