package entities

import (
	"time"

	"coursehunt/server/internals/generic"
)

type Course struct {
	ID                   string                  `json:"id" db:"id"`
	TutorID              string                  `json:"tutor_id,omitempty" db:"tutor_id"`
	Slug                 string                  `json:"slug" db:"slug"`
	Title                string                  `json:"title" db:"title"`
	ShortDescription     *string                 `json:"short_description,omitempty" db:"short_description"`
	LongDescription      *string                 `json:"long_description,omitempty" db:"long_description"`
	ImageURL             *string                 `json:"image_url,omitempty" db:"image_url"`
	PreviewVideoURL      *string                 `json:"preview_video_url,omitempty" db:"preview_video_url"`
	Language             string                  `json:"language" db:"language"`
	Level                string                  `json:"level" db:"level"`
	ActualPrice          float64                 `json:"actual_price" db:"actual_price"`
	FinalPrice           float64                 `json:"final_price" db:"final_price"`
	Benefits             []string                `json:"benefits" db:"benefits"`
	Requirements         []string                `json:"requirements" db:"requirements"`
	CategoryID           *string                 `json:"-" db:"category_id"`
	CouponAllowed        bool                    `json:"coupon_allowed" db:"coupon_allowed"`
	IsFree               bool                    `json:"is_free" db:"is_free"`
	TotalLectures        int                     `json:"total_lectures" db:"total_lectures"`
	TotalDurationSeconds int                     `json:"total_duration_seconds" db:"total_duration_seconds"`
	RatingAvg            float64                 `json:"rating_avg" db:"rating_avg"`
	FeedbackCount        int                     `json:"feedback_count" db:"feedback_count"`
	StudentCount         int                     `json:"student_count" db:"student_count"`
	Status               string                  `json:"status" db:"status"`
	Tutor                *generic.InstructorInfo `json:"tutor,omitempty" db:"tutor"`
	CreatedAt            time.Time               `json:"created_at" db:"created_at"`
	UpdatedAt            time.Time               `json:"updated_at" db:"updated_at"`
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

// Status is always "draft" on create — never client-settable here. Tutors
// change it afterward via the dedicated status action (UpdateCourseRequest).
type CreateCourseRequest struct {
	Title            string   `json:"title" validate:"required,min=3,max=200"`
	ShortDescription *string  `json:"short_description" validate:"omitempty,max=500"`
	LongDescription  *string  `json:"long_description" validate:"omitempty,max=50000"`
	ImageURL         *string  `json:"image_url" validate:"omitempty,url"`
	PreviewVideoURL  *string  `json:"preview_video_url" validate:"omitempty,url"`
	CategoryID       *string  `json:"category_id" validate:"omitempty,uuid"`
	Language         string   `json:"language" validate:"omitempty,max=50"`
	Level            string   `json:"level" validate:"omitempty,oneof=beginner intermediate advanced all"`
	ActualPrice      float64  `json:"actual_price" validate:"omitempty,min=0"`
	FinalPrice       float64  `json:"final_price" validate:"omitempty,min=0,ltefield=ActualPrice"`
	Benefits         []string `json:"benefits" validate:"omitempty,max=20,dive,max=300"`
	Requirements     []string `json:"requirements" validate:"omitempty,max=20,dive,max=300"`
	CouponAllowed    bool     `json:"coupon_allowed"`
	IsFree           bool     `json:"is_free"`
}

// CourseFileCleanup carries the pre-update file URLs out of
// CoursesRepository.UpdateRepository so the controller can delete any object
// a course update just replaced or cleared. Never serialized to a response.
type CourseFileCleanup struct {
	OldImageURL        *string
	OldPreviewVideoURL *string
}

type UpdateCourseRequest struct {
	Title            *string   `json:"title" validate:"omitempty,min=3,max=200"`
	ShortDescription *string   `json:"short_description" validate:"omitempty,max=500"`
	LongDescription  *string   `json:"long_description" validate:"omitempty,max=50000"`
	ImageURL         *string   `json:"image_url" validate:"omitempty,url"`
	PreviewVideoURL  *string   `json:"preview_video_url" validate:"omitempty,url"`
	Language         *string   `json:"language" validate:"omitempty,max=50"`
	Level            *string   `json:"level" validate:"omitempty,oneof=beginner intermediate advanced all"`
	ActualPrice      *float64  `json:"actual_price" validate:"omitempty,min=0"`
	FinalPrice       *float64  `json:"final_price" validate:"omitempty,min=0"`
	Benefits         *[]string `json:"benefits" validate:"omitempty,max=20,dive,max=300"`
	Requirements     *[]string `json:"requirements" validate:"omitempty,max=20,dive,max=300"`
	CategoryID       *string   `json:"category_id" validate:"omitempty,uuid"`
	CouponAllowed    *bool     `json:"coupon_allowed"`
	IsFree           *bool     `json:"is_free"`
	Status           *string   `json:"status" validate:"omitempty,oneof=draft published archived"`
}

type CoursePublicResponse struct {
	ID               string                 `json:"id" db:"id"`
	Slug             string                 `json:"slug" db:"slug"`
	Title            string                 `json:"title" db:"title"`
	ShortDescription *string                `json:"short_description" db:"short_description"`
	ImageURL         *string                `json:"image_url" db:"image_url"`
	ActualPrice      float64                `json:"actual_price" db:"actual_price"`
	FinalPrice       float64                `json:"final_price" db:"final_price"`
	IsFree           bool                   `json:"is_free" db:"is_free"`
	Benefits         []string               `json:"benefits" db:"benefits"`
	Level            string                 `json:"level" db:"level"`
	RatingAvg        float64                `json:"rating_avg" db:"rating_avg"`
	FeedbackCount    int                    `json:"feedback_count" db:"feedback_count"`
	Category         *generic.CategoryInfo  `json:"category"`
	Instructor       generic.InstructorInfo `json:"instructor" db:"instructor"`
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
	ID                   string                 `json:"id"`
	Slug                 string                 `json:"slug"`
	Title                string                 `json:"title"`
	ShortDescription     *string                `json:"short_description"`
	LongDescription      *string                `json:"long_description"`
	ImageURL             *string                `json:"image_url"`
	PreviewVideoURL      *string                `json:"preview_video_url"`
	Language             string                 `json:"language"`
	Level                string                 `json:"level"`
	ActualPrice          float64                `json:"actual_price"`
	FinalPrice           float64                `json:"final_price"`
	IsFree               bool                   `json:"is_free"`
	Benefits             []string               `json:"benefits"`
	Requirements         []string               `json:"requirements"`
	Category             *generic.CategoryInfo  `json:"category"`
	Instructor           generic.InstructorInfo `json:"instructor"`
	TotalLectures        int                    `json:"total_lectures"`
	TotalDurationSeconds int                    `json:"total_duration_seconds"`
	RatingAvg            float64                `json:"rating_avg"`
	FeedbackCount        int                    `json:"feedback_count"`
	IsEnrolled           bool                   `json:"is_enrolled"`
	Chapters             []ChapterResponse      `json:"chapters"`
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
	Course            generic.CourseInfo `json:"course" db:"course"`
	CompletionPercent float64            `json:"completion_percent"`
	Completed         bool               `json:"completed"`
	Chapters          []StudyChapterItem `json:"chapters"`
}
