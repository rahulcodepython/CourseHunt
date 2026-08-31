package wishlist

import (
	"time"

	"coursehunt/server/internals/generic"
)

type WishlistItem struct {
	ID       string             `json:"id" db:"id"`
	UserID   string             `json:"user_id" db:"user_id"`
	CourseID string             `json:"course_id" db:"course_id"`
	Course   generic.CourseInfo `json:"course" db:"course"`
	AddedAt  time.Time          `json:"added_at" db:"added_at"`
}

type CreateWishlistRequest struct {
	CourseID string `json:"course_id" validate:"required,uuid"`
}
