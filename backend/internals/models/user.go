package models

import "time"

type User struct {
	ID               string    `json:"id"`
	LegacyID         string    `json:"_id"`
	Name             string    `json:"name"`
	FirstName        string    `json:"firstName"`
	LastName         string    `json:"lastName"`
	Email            string    `json:"email"`
	EmailVerified    bool      `json:"email_verified"`
	Image            string    `json:"image"`
	Position         string    `json:"position"` // student, tutor, or admin
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
	Phone            string    `json:"phone"`
	Address          string    `json:"address"`
	City             string    `json:"city"`
	Country          string    `json:"country"`
	Zip              string    `json:"zip"`
	Banned           bool      `json:"banned"`
	PurchasedCourses int       `json:"purchasedCourses"`
	CompletedCourses int       `json:"completedCourses"`
}

func (u *User) ToResponse() UserResponse {
	return UserResponse{
		ID:               u.ID,
		Name:             u.Name,
		FirstName:        u.FirstName,
		LastName:         u.LastName,
		Phone:            u.Phone,
		Address:          u.Address,
		City:             u.City,
		Country:          u.Country,
		Zip:              u.Zip,
		Email:            u.Email,
		Role:             u.Position,
		Avatar:           Media{URL: u.Image, FileType: "image"},
		CreatedAt:        u.CreatedAt,
		UpdatedAt:        u.UpdatedAt,
		PurchasedCourses: u.PurchasedCourses,
		CompletedCourses: u.CompletedCourses,
	}
}

type AuthUser struct {
	ID    string `json:"id"`
	Email string `json:"email"`
	Position string `json:"position"`
}

type UserResponse struct {
	ID               string    `json:"_id"`
	Name             string    `json:"name"`
	FirstName        string    `json:"firstName"`
	LastName         string    `json:"lastName"`
	Phone            string    `json:"phone"`
	Address          string    `json:"address"`
	City             string    `json:"city"`
	Country          string    `json:"country"`
	Zip              string    `json:"zip"`
	Email            string    `json:"email"`
	Role             string    `json:"role"`
	Avatar           Media     `json:"avatar"`
	CreatedAt        time.Time `json:"createdAt"`
	UpdatedAt        time.Time `json:"updatedAt"`
	PurchasedCourses int       `json:"purchasedCourses"`
	CompletedCourses int       `json:"completedCourses"`
}
