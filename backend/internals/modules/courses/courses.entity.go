package courses

import (
	"database/sql"
	"time"
)

// ── DB Row Structs ────────────────────────────────────────────────────────────

type Course struct {
	ID                   string         `json:"id"`
	TutorID              sql.NullString `json:"-"`
	Slug                 string         `json:"slug"`
	Title                string         `json:"title"`
	ShortDescription     sql.NullString `json:"-"`
	LongDescription      sql.NullString `json:"-"`
	ImageURL             sql.NullString `json:"-"`
	PreviewVideoURL      sql.NullString `json:"-"`
	Language             string         `json:"language"`
	Level                string         `json:"level"`
	ActualPrice          float64        `json:"actual_price"`
	FinalPrice           float64        `json:"final_price"`
	Benefits             []string       `json:"benefits"`
	Requirements         []string       `json:"requirements"`
	CategoryID           sql.NullString `json:"-"`
	SubcategoryID        sql.NullString `json:"-"`
	CouponAllowed        bool           `json:"coupon_allowed"`
	TotalLectures        int            `json:"total_lectures"`
	TotalDurationSeconds int            `json:"total_duration_seconds"`
	RatingAvg            float64        `json:"rating_avg"`
	FeedbackCount        int            `json:"feedback_count"`
	Status               string         `json:"status"`
	CreatedAt            time.Time      `json:"created_at"`
	UpdatedAt            time.Time      `json:"updated_at"`
}
