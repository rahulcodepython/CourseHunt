package wishlist

import (
	"coursehunt-backend/internals/models"
	"time"
)

type Wishlist struct {
	ID      string            `json:"id"`
	UserID  string            `json:"user_id"`
	Course  models.CourseInfo `json:"course"`
	AddedAt time.Time         `json:"added_at"`
}
