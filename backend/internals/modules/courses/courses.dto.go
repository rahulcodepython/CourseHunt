package courses

import (
	"time"

	"coursehunt-backend/internals/models"
)

// ── Courses ──

type CreateCourseRequest struct {
	Title            string  `json:"title" validate:"required,min=3,max=200"`
	ShortDescription *string `json:"short_description"`
	CategoryID       *string `json:"category_id"`
	SubcategoryID    *string `json:"subcategory_id"`
	Language         string  `json:"language"`
	Level            string  `json:"level" validate:"omitempty,oneof=beginner intermediate advanced all"`
	Status           string  `json:"status" validate:"omitempty,oneof=draft published archived"`
}

type UpdateCourseRequest struct {
	Title            *string  `json:"title" validate:"omitempty,min=3,max=200"`
	ShortDescription *string  `json:"short_description"`
	LongDescription  *string  `json:"long_description"`
	ImageURL         *string  `json:"image_url"`
	PreviewVideoURL  *string  `json:"preview_video_url"`
	Language         *string  `json:"language"`
	Level            *string  `json:"level" validate:"omitempty,oneof=beginner intermediate advanced all"`
	ActualPrice      *float64 `json:"actual_price" validate:"omitempty,min=0"`
	FinalPrice       *float64 `json:"final_price" validate:"omitempty,min=0"`
	Benefits         []string `json:"benefits"`
	Requirements     []string `json:"requirements"`
	CategoryID       *string  `json:"category_id"`
	SubcategoryID    *string  `json:"subcategory_id"`
	CouponAllowed    *bool    `json:"coupon_allowed"`
	Status           *string  `json:"status" validate:"omitempty,oneof=draft published archived"`
}

// ── Course Responses ──



type CourseCardResponse struct {
	ID               string         `json:"id"`
	Slug             string         `json:"slug"`
	Title            string         `json:"title"`
	ShortDescription *string        `json:"short_description"`
	ImageURL         *string        `json:"image_url"`
	ActualPrice      float64        `json:"actual_price"`
	FinalPrice       float64        `json:"final_price"`
	Benefits         []string       `json:"benefits"`
	Level            string         `json:"level"`
	RatingAvg        float64        `json:"rating_avg"`
	FeedbackCount    int            `json:"feedback_count"`
	Instructor       models.InstructorInfo `json:"instructor"`
}

type LessonCardResponse struct {
	ID               string  `json:"id"`
	LessonNo         int     `json:"lesson_no"`
	Title            string  `json:"title"`
	LessonType       string  `json:"lesson_type"`
	ShortDescription *string `json:"short_description"`
	PreviewVideoURL  *string `json:"preview_video_url"`
	DurationSeconds  int     `json:"duration_seconds"`
}

type ChapterCardResponse struct {
	ID                   string               `json:"id"`
	ChapterNo            int                  `json:"chapter_no"`
	Title                string               `json:"title"`
	TotalLectures        int                  `json:"total_lectures"`
	TotalDurationSeconds int                  `json:"total_duration_seconds"`
	Lessons              []LessonCardResponse `json:"lessons"`
}

type CourseLandingResponse struct {
	ID                   string                `json:"id"`
	Slug                 string                `json:"slug"`
	Title                string                `json:"title"`
	ShortDescription     *string               `json:"short_description"`
	LongDescription      *string               `json:"long_description"`
	ImageURL             *string               `json:"image_url"`
	PreviewVideoURL      *string               `json:"preview_video_url"`
	Language             string                `json:"language"`
	Level                string                `json:"level"`
	ActualPrice          float64               `json:"actual_price"`
	FinalPrice           float64               `json:"final_price"`
	Benefits             []string              `json:"benefits"`
	Requirements         []string              `json:"requirements"`
	Category             *models.CategoryInfo  `json:"category"`
	Subcategory          *models.CategoryInfo  `json:"subcategory"`
	Instructor           models.InstructorInfo `json:"instructor"`
	TotalLectures        int                   `json:"total_lectures"`
	TotalDurationSeconds int                   `json:"total_duration_seconds"`
	RatingAvg            float64               `json:"rating_avg"`
	FeedbackCount        int                   `json:"feedback_count"`
	IsEnrolled           bool                  `json:"is_enrolled"`
	Chapters             []ChapterCardResponse `json:"chapters"`
}

type EnrolledCourseResponse struct {
	ID                   string         `json:"id"`
	Slug                 string         `json:"slug"`
	Title                string         `json:"title"`
	ImageURL             *string        `json:"image_url"`
	Instructor           models.InstructorInfo `json:"instructor"`
	CompletionPercent    float64        `json:"completion_percent"`
	LastAccessedLessonID *string        `json:"last_accessed_lesson_id"`
}

// ── Course created/updated response ──

type CourseCreatedResponse struct {
	ID        string    `json:"id"`
	Slug      string    `json:"slug"`
	Title     string    `json:"title"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
}
