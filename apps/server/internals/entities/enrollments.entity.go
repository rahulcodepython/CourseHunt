package entities

import (
	"time"

	"coursehunt/server/internals/generic"
)

type ListEnrollmentResponse struct {
	ID                string          `json:"id" db:"id"`
	User              generic.UserInfo `json:"user" db:""`
	CompletionPercent float64         `json:"completion_percent" db:"completion_percent"`
	Completed         bool            `json:"completed" db:"completed"`
	Revoked           bool            `json:"revoked" db:"revoked"`
	EnrolledAt        time.Time       `json:"enrolled_at" db:"enrolled_at"`
}
