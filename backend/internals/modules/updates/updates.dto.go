package updates

import (
	"time"
	"coursehunt-backend/internals/models"
)

// ── Updates ──

type CreateUpdateRequest struct {
	Message  string  `json:"message" validate:"required,min=1,max=2000"`
	CourseID *string `json:"course_id" validate:"omitempty,uuid"`
}

type UpdateUpdateRequest struct {
	Message string `json:"message" validate:"required,min=1,max=2000"`
}

// ── Update Feed Response ──

type UpdateFeedItem struct {
	ID          string    `json:"id"`
	Message     string    `json:"message"`
	CourseID    *string   `json:"course_id"`
	CourseTitle *string   `json:"course_title"`
	CreatedAt   time.Time `json:"created_at"`
}

type UpdateFeedResponse struct {
	Unseen []UpdateFeedItem  `json:"unseen"`
	Older  models.PaginatedResponse `json:"older"`
}
