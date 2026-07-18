package updates

import (
	"coursehunt/api/internals/models"
	"time"
)

type CourseUpdate struct {
	ID        string            `json:"id" db:"id"`
	Course    models.CourseInfo `json:"course" db:""`
	CreatedBy *string           `json:"created_by" db:"created_by"`
	Message   string            `json:"message" db:"message"`
	CreatedAt time.Time         `json:"created_at" db:"created_at"`
}

type CreateUpdateRequest struct {
	Message  string  `json:"message" validate:"required,min=1,max=2000"`
	CourseID *string `json:"course_id" validate:"omitempty,uuid"`
}

type UpdateUpdateRequest struct {
	Message string `json:"message" validate:"required,min=1,max=2000"`
}

type UpdateFeedItem struct {
	ID        string            `json:"id" db:"id"`
	Message   string            `json:"message" db:"message"`
	Course    models.CourseInfo `json:"course" db:""`
	CreatedAt time.Time         `json:"created_at" db:"created_at"`
}

type UpdateFeedResponse struct {
	Unseen []UpdateFeedItem                           `json:"unseen"`
	Older  models.PaginatedResponse[[]UpdateFeedItem] `json:"older"`
}
