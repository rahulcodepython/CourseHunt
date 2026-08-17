package entities

import "time"

type LogEntry struct {
	ID         int64     `json:"id" db:"id"`
	Message    string    `json:"message" db:"message"`
	ActorEmail *string   `json:"actor_email" db:"actor_email"`
	Success    bool      `json:"success" db:"success"`
	CreatedAt  time.Time `json:"created_at" db:"created_at"`
}
