package models

import "time"

type Category struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

type CategoryResponse struct {
	ID   string `json:"_id"`
	Name string `json:"name"`
}

type Course struct {
	ID              int       `json:"id"`
	Title           string    `json:"title"`
	Description     string    `json:"description"`
	Duration        string    `json:"duration"`
	Price           float64   `json:"price"`
	OriginalPrice   float64   `json:"original_price"`
	CategoryID      int       `json:"category_id"`
	Discount        string    `json:"discount"`
	TotalRevenue    float64   `json:"total_revenue"`
	ImageURL        string    `json:"image_url"`
	PreviewVideoURL string    `json:"preview_video_url"`
	LongDescription string    `json:"long_description"`
	IsPublished     bool      `json:"is_published"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

type Chapter struct {
	ID           int      `json:"id"`
	LegacyID     int      `json:"_id"`
	CourseID     int      `json_id:"course_id,omitempty"`
	Title        string   `json:"title"`
	Preview      bool     `json:"preview"`
	OrderIndex   int      `json:"order_index,omitempty"`
	TotalLessons int      `json:"totallessons"`
	Lessons      []Lesson `json:"lessons"`
}

type Lesson struct {
	ID         int    `json:"id"`
	LegacyID   int    `json:"_id"`
	ChapterID  int    `json:"chapter_id,omitempty"`
	Title      string `json:"title"`
	Duration   string `json:"duration"`
	Type       string `json:"type"` // 'video', 'reading'
	VideoURL   Media  `json:"videoUrl"`
	Content    string `json:"content"`
	OrderIndex int    `json:"order_index,omitempty"`
}

type ViewedLesson struct {
	ChapterID int       `json:"chapterId"`
	LessonID  int       `json:"lessonId"`
	ViewedAt  time.Time `json:"viewedAt"`
}
