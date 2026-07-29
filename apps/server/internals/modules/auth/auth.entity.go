package auth

import "time"

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type GoogleLoginRequest struct {
	IDToken string `json:"idToken"`
}

type ChangePasswordRequest struct {
	CurrentPassword string `json:"currentPassword" validate:"required"`
	NewPassword     string `json:"newPassword" validate:"required,min=8"`
}

type TokenResponse struct {
	AccessToken string `json:"accessToken"`
	User        *User  `json:"user"`
}

type User struct {
	ID                string     `json:"id" db:"id"`
	Name              string     `json:"name" db:"name"`
	Email             string     `json:"email" db:"email"`
	EmailVerified     bool       `json:"emailVerified" db:"emailVerified"`
	Image             *string    `json:"image" db:"image"`
	CreatedAt         time.Time  `json:"createdAt" db:"createdAt"`
	UpdatedAt         time.Time  `json:"updatedAt" db:"updatedAt"`
	Banned            bool       `json:"banned" db:"banned"`
	PasswordChangedAt *time.Time `json:"passwordChangedAt" db:"passwordChangedAt"`
	Roles             []string   `json:"roles"`
	Permissions       []string   `json:"permissions"`
}

type CreateUserRequest struct {
	Name     string `json:"name" validate:"required"`
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=8"`
	Role     string `json:"role" validate:"required,oneof=admin tutor"`
}

type CreateUserResponse struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
	Role  string `json:"role"`
}

type Session struct {
	ID               string    `json:"id" db:"id"`
	UserID           string    `json:"user_id" db:"user_id"`
	RefreshTokenHash string    `json:"refresh_token_hash" db:"refresh_token_hash"`
	ExpiresAt        time.Time `json:"expires_at" db:"expires_at"`
	CreatedAt        time.Time `json:"created_at" db:"created_at"`
}
