package notifications

import "time"

// Notification IDs are sequential bigints (not UUID like the rest of this
// schema) — the frontend cursor-paginates on them ("everything after id X"),
// which only works with a monotonic id.
type Notification struct {
	ID        int64     `json:"id" db:"id"`
	Type      string    `json:"type" db:"type"`
	Message   string    `json:"message" db:"message"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}
