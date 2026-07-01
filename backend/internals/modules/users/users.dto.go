package users

import "time"

// ── Users ──

type AssignRoleRequest struct {
	RoleID int `json:"role_id" validate:"required,min=1"`
}

// ── User List Response ──

type UserListResponse struct {
	ID            string    `json:"id"`
	Name          string    `json:"name"`
	Email         string    `json:"email"`
	Image         *string   `json:"image"`
	EmailVerified bool      `json:"emailVerified"`
	Banned        bool      `json:"banned"`
	CreatedAt     time.Time `json:"createdAt"`
	Roles         []Role    `json:"roles"`
}
