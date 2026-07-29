package entities

import (
	"time"

	"coursehunt/server/internals/generic"
)

type Course struct {
	ID                   string    `json:"id" db:"id"`
	TutorID              string    `json:"tutor_id,omitempty" db:"tutor_id"`
	Slug                 string    `json:"slug" db:"slug"`
	Title                string    `json:"title" db:"title"`
	ShortDescription     *string   `json:"short_description,omitempty" db:"short_description"`
	LongDescription      *string   `json:"long_description,omitempty" db:"long_description"`
	ImageURL             *string   `json:"image_url,omitempty" db:"image_url"`
	PreviewVideoURL      *string   `json:"preview_video_url,omitempty" db:"preview_video_url"`
	Language             string    `json:"language" db:"language"`
	Level                string    `json:"level" db:"level"`
	ActualPrice          float64   `json:"actual_price" db:"actual_price"`
	FinalPrice           float64   `json:"final_price" db:"final_price"`
	Benefits             []string  `json:"benefits" db:"benefits"`
	Requirements         []string  `json:"requirements" db:"requirements"`
	CategoryID           *string   `json:"-" db:"category_id"`
	SubcategoryID        *string   `json:"-" db:"subcategory_id"`
	CouponAllowed        bool      `json:"coupon_allowed" db:"coupon_allowed"`
	TotalLectures        int       `json:"total_lectures" db:"total_lectures"`
	TotalDurationSeconds int       `json:"total_duration_seconds" db:"total_duration_seconds"`
	RatingAvg            float64   `json:"rating_avg" db:"rating_avg"`
	FeedbackCount        int       `json:"feedback_count" db:"feedback_count"`
	StudentCount         int       `json:"student_count" db:"student_count"`
	Status               string    `json:"status" db:"status"`
	CreatedAt            time.Time `json:"created_at" db:"created_at"`
	UpdatedAt            time.Time `json:"updated_at" db:"updated_at"`
}

type StudyLessonItem struct {
	ID              string `json:"id" db:"id"`
	LessonNo        int    `json:"lesson_no" db:"lesson_no"`
	Title           string `json:"title" db:"title"`
	LessonType      string `json:"lesson_type" db:"lesson_type"`
	DurationSeconds int    `json:"duration_seconds" db:"duration_seconds"`
	Completed       bool   `json:"completed" db:"completed"`
}

type ChapterProgressInfo struct {
	LessonsCompleted int  `json:"lessons_completed"`
	Completed        bool `json:"completed"`
}

type StudyChapterItem struct {
	ID                   string              `json:"id"`
	ChapterNo            int                 `json:"chapter_no"`
	Title                string              `json:"title"`
	TotalLectures        int                 `json:"total_lectures"`
	TotalDurationSeconds int                 `json:"total_duration_seconds"`
	Progress             ChapterProgressInfo `json:"progress"`
	Lessons              []StudyLessonItem   `json:"lessons"`
}

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
	Title            *string   `json:"title" validate:"omitempty,min=3,max=200"`
	ShortDescription *string   `json:"short_description"`
	LongDescription  *string   `json:"long_description"`
	ImageURL         *string   `json:"image_url"`
	PreviewVideoURL  *string   `json:"preview_video_url"`
	Language         *string   `json:"language"`
	Level            *string   `json:"level" validate:"omitempty,oneof=beginner intermediate advanced all"`
	ActualPrice      *float64  `json:"actual_price" validate:"omitempty,min=0"`
	FinalPrice       *float64  `json:"final_price" validate:"omitempty,min=0"`
	Benefits         *[]string `json:"benefits"`
	Requirements     *[]string `json:"requirements"`
	CategoryID       *string   `json:"category_id"`
	SubcategoryID    *string   `json:"subcategory_id"`
	CouponAllowed    *bool     `json:"coupon_allowed"`
	Status           *string   `json:"status" validate:"omitempty,oneof=draft published archived"`
}

type CoursePublicResponse struct {
	ID               string                `json:"id" db:"id"`
	Slug             string                `json:"slug" db:"slug"`
	Title            string                `json:"title" db:"title"`
	ShortDescription *string               `json:"short_description" db:"short_description"`
	ImageURL         *string               `json:"image_url" db:"image_url"`
	ActualPrice      float64               `json:"actual_price" db:"actual_price"`
	FinalPrice       float64               `json:"final_price" db:"final_price"`
	Benefits         []string              `json:"benefits" db:"benefits"`
	Level            string                `json:"level" db:"level"`
	RatingAvg        float64               `json:"rating_avg" db:"rating_avg"`
	FeedbackCount    int                   `json:"feedback_count" db:"feedback_count"`
	Category         *generic.CategoryInfo  `json:"category"`
	Subcategory      *generic.CategoryInfo  `json:"subcategory"`
	Instructor       generic.InstructorInfo `json:"instructor" db:""`
}

type LessonResponse struct {
	ID               string  `json:"id"`
	LessonNo         int     `json:"lesson_no"`
	Title            string  `json:"title"`
	LessonType       string  `json:"lesson_type"`
	ShortDescription *string `json:"short_description"`
	PreviewVideoURL  *string `json:"preview_video_url"`
	DurationSeconds  int     `json:"duration_seconds"`
}

type ChapterResponse struct {
	ID                   string           `json:"id"`
	ChapterNo            int              `json:"chapter_no"`
	Title                string           `json:"title"`
	TotalLectures        int              `json:"total_lectures"`
	TotalDurationSeconds int              `json:"total_duration_seconds"`
	Lessons              []LessonResponse `json:"lessons"`
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
	Category             *generic.CategoryInfo  `json:"category"`
	Subcategory          *generic.CategoryInfo  `json:"subcategory"`
	Instructor           generic.InstructorInfo `json:"instructor"`
	TotalLectures        int                   `json:"total_lectures"`
	TotalDurationSeconds int                   `json:"total_duration_seconds"`
	RatingAvg            float64               `json:"rating_avg"`
	FeedbackCount        int                   `json:"feedback_count"`
	IsEnrolled           bool                  `json:"is_enrolled"`
	Chapters             []ChapterResponse     `json:"chapters"`
}

type EnrolledCourseResponse struct {
	ID                   string  `json:"id" db:"id"`
	Slug                 string  `json:"slug" db:"slug"`
	Title                string  `json:"title" db:"title"`
	ImageURL             *string `json:"image_url" db:"image_url"`
	CompletionPercent    float64 `json:"completion_percent" db:"completion_percent"`
	LastAccessedLessonID *string `json:"last_accessed_lesson_id" db:"last_accessed_lesson_id"`
}

type CourseStudyResponse struct {
	Course            generic.CourseInfo  `json:"course"`
	CompletionPercent float64            `json:"completion_percent"`
	Completed         bool               `json:"completed"`
	Chapters          []StudyChapterItem `json:"chapters"`
}
