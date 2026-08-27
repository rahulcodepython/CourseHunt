package entities

import "time"

type UserRole struct {
	ID   string `json:"id" db:"id"`
	Name string `json:"name" db:"name"`
}

type AssignRoleRequest struct {
	RoleIDs []string `json:"role_ids" validate:"required"`
}

type UserListResponse struct {
	ID            string     `json:"id" db:"id"`
	Name          string     `json:"name" db:"name"`
	Email         string     `json:"email" db:"email"`
	Image         *string    `json:"image" db:"image"`
	EmailVerified bool       `json:"email_verified" db:"email_verified"`
	Banned        bool       `json:"banned" db:"banned"`
	CreatedAt     time.Time  `json:"created_at" db:"created_at"`
	Roles         []UserRole `json:"roles" db:"-"`
}

type RoleAssignmentResponse struct {
	UserID  string   `json:"user_id"`
	RoleIDs []string `json:"role_ids"`
}
