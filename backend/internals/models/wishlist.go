package models

import "time"

type Wishlist struct {
	ID       string    `json:"id"`
	UserID   string    `json:"user_id"`
	CourseID string    `json:"course_id"`
	AddedAt  time.Time `json:"added_at"`
}

type CartItem struct {
	ID       string    `json:"id"`
	UserID   string    `json:"user_id"`
	CourseID string    `json:"course_id"`
	AddedAt  time.Time `json:"added_at"`
}
