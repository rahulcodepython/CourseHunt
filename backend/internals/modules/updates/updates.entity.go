package updates

import (
	"coursehunt-backend/internals/models"
	"time"
)

type CourseUpdate struct {
	ID        string            `json:"id"`
	Course    models.CourseInfo `json:"course"`
	CreatedBy *string           `json:"created_by"`
	Message   string            `json:"message"`
	CreatedAt time.Time         `json:"created_at"`
}

type CreateUpdateRequest struct {
	Message  string  `json:"message" validate:"required,min=1,max=2000"`
	CourseID *string `json:"course_id" validate:"omitempty,uuid"`
}

type UpdateUpdateRequest struct {
	Message string `json:"message" validate:"required,min=1,max=2000"`
}

// ── Update Feed Response ──

type UpdateFeedItem struct {
	ID        string            `json:"id"`
	Message   string            `json:"message"`
	Course    models.CourseInfo `json:"course"`
	CreatedAt time.Time         `json:"created_at"`
}

type UpdateFeedResponse struct {
	Unseen []UpdateFeedItem                           `json:"unseen"`
	Older  models.PaginatedResponse[[]UpdateFeedItem] `json:"older"`
}
