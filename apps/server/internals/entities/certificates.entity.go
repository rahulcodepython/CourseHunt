package entities

import (
	"time"

	"coursehunt/server/internals/generic"
)

type Certificate struct {
	ID       string            `json:"id" db:"id"`
	UserID   string            `json:"user_id" db:"user_id"`
	Course   generic.CourseInfo `json:"course" db:"course"`
	IssuedAt time.Time         `json:"issued_at" db:"issued_at"`
}
