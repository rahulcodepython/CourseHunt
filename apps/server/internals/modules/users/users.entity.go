package users

import "time"

type Role struct {
	ID   int    `json:"id" db:"id"`
	Name string `json:"name" db:"name"`
}

type AssignRoleRequest struct {
	RoleID int `json:"role_id" validate:"required,min=1"`
}

type UserListResponse struct {
	ID            string    `json:"id" db:"id"`
	Name          string    `json:"name" db:"name"`
	Email         string    `json:"email" db:"email"`
	Image         *string   `json:"image" db:"image"`
	EmailVerified bool      `json:"email_verified" db:"email_verified"`
	Banned        bool      `json:"banned" db:"banned"`
	CreatedAt     time.Time `json:"created_at" db:"created_at"`
	Roles         []Role    `json:"roles" db:"-"`
}

type RoleAssignmentResponse struct {
	UserID string `json:"user_id"`
	RoleID int    `json:"role_id"`
}
