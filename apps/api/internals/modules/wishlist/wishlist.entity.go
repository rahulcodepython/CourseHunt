package wishlist

import (
	"coursehunt-backend/internals/models"
	"time"
)

type WishlistItem struct {
	ID      string            `json:"id" db:"id"`
	UserID  string            `json:"user_id" db:"user_id"`
	Course  models.CourseInfo `json:"course" db:""`
	AddedAt time.Time         `json:"added_at" db:"added_at"`
}

type CreateWishlistRequest struct {
	CourseID string `json:"course_id" validate:"required,uuid"`
}
