package cart

import (
	"coursehunt/api/internals/generic"
	"time"
)

type CartItem struct {
	ID       string            `json:"id" db:"id"`
	UserID   string            `json:"user_id" db:"user_id"`
	CourseID generic.CourseInfo `json:"course" db:""`
	AddedAt  time.Time         `json:"added_at" db:"added_at"`
}

type CreateCartRequest struct {
	CourseId string `json:"course_id" validate:"required,uuid"`
}
