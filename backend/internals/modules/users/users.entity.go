package users

import "time"

type User struct {
	ID            string    `json:"id"`
	Name          string    `json:"name"`
	Email         string    `json:"email"`
	EmailVerified bool      `json:"emailVerified"`
	Image         *string   `json:"image"`
	Banned        bool      `json:"banned"`
	CreatedAt     time.Time `json:"createdAt"`
	UpdatedAt     time.Time `json:"updatedAt"`
}

type Role struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

type UserWithRoles struct {
	User
	Roles []Role `json:"roles"`
}
