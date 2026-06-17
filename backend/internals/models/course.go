package models

import (
	"database/sql"
	"time"
)

// ── DB Row Structs ────────────────────────────────────────────────────────────

type Course struct {
	ID                  string         `json:"id"`
	TutorID             sql.NullString `json:"-"`
	Slug                string         `json:"slug"`
	Title               string         `json:"title"`
	ShortDescription    sql.NullString `json:"-"`
	LongDescription     sql.NullString `json:"-"`
	ImageURL            sql.NullString `json:"-"`
	PreviewVideoURL     sql.NullString `json:"-"`
	Language            string         `json:"language"`
	Level               string         `json:"level"`
	ActualPrice         float64        `json:"actual_price"`
	FinalPrice          float64        `json:"final_price"`
	Benefits            []string       `json:"benefits"`
	Requirements        []string       `json:"requirements"`
	CategoryID          sql.NullString `json:"-"`
	SubcategoryID       sql.NullString `json:"-"`
	CouponAllowed       bool           `json:"coupon_allowed"`
	TotalLectures       int            `json:"total_lectures"`
	TotalDurationSeconds int           `json:"total_duration_seconds"`
	RatingAvg           float64        `json:"rating_avg"`
	FeedbackCount       int            `json:"feedback_count"`
	Status              string         `json:"status"`
	CreatedAt           time.Time      `json:"created_at"`
	UpdatedAt           time.Time      `json:"updated_at"`
}

type Chapter struct {
	ID                  string    `json:"id"`
	CourseID            string    `json:"course_id"`
	ChapterNo           int       `json:"chapter_no"`
	Title               string    `json:"title"`
	TotalLectures       int       `json:"total_lectures"`
	TotalDurationSeconds int      `json:"total_duration_seconds"`
	CreatedAt           time.Time `json:"created_at"`
	UpdatedAt           time.Time `json:"updated_at"`
}

type Lesson struct {
	ID               string         `json:"id"`
	ChapterID        string         `json:"chapter_id"`
	LessonNo         int            `json:"lesson_no"`
	Title            string         `json:"title"`
	LessonType       string         `json:"lesson_type"`
	ShortDescription sql.NullString `json:"-"`
	PreviewVideoURL  sql.NullString `json:"-"`
	DurationSeconds  int            `json:"duration_seconds"`
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`
}

type LessonVideoContent struct {
	ID             string `json:"id"`
	LessonID       string `json:"lesson_id"`
	VideoURL       string `json:"video_url"`
	WrittenContent *string `json:"written_content"`
}

type LessonDocumentContent struct {
	ID       string `json:"id"`
	LessonID string `json:"lesson_id"`
	Content  string `json:"content"`
}

type LessonResource struct {
	ID       string `json:"id"`
	LessonID string `json:"lesson_id"`
	Title    string `json:"title"`
	FileURL  string `json:"file_url"`
	FileType *string `json:"file_type"`
}
