package entities

import (
	"coursehunt/server/internals/generic"
	"time"
)

type CourseUpdate struct {
	ID        string             `json:"id" db:"id"`
	Course    generic.CourseInfo `json:"course" db:"course"`
	CreatedBy *string            `json:"created_by" db:"created_by"`
	Message   string             `json:"message" db:"message"`
	CreatedAt time.Time          `json:"created_at" db:"created_at"`
}

type CreateUpdateRequest struct {
	Message  string  `json:"message" validate:"required,min=1,max=2000"`
	CourseID *string `json:"course_id" validate:"omitempty,uuid"`
}

type UpdateUpdateRequest struct {
	Message string `json:"message" validate:"required,min=1,max=2000"`
}

type UpdateFeedItem struct {
	ID        string             `json:"id" db:"id"`
	Message   string             `json:"message" db:"message"`
	Course    generic.CourseInfo `json:"course" db:"course"`
	CreatedAt time.Time          `json:"created_at" db:"created_at"`
	IsUnseen  bool               `json:"is_unseen" db:"is_unseen"`
}

type UpdateFeedResponse struct {
	Updates generic.PaginatedResponse[[]UpdateFeedItem] `json:"updates"`
}
