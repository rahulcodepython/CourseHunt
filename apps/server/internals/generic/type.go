package generic

import "github.com/golang-jwt/jwt/v5"

// PaginatedResponse is a generic paginated list wrapper.
type PaginatedResponse[T any] struct {
	Data  T   `json:"data"`
	Total int `json:"total"`
	Page  int `json:"page"`
	Limit int `json:"limit"`
}

// UserInfo represents basic user details used across multiple modules.
type UserInfo struct {
	ID    string  `json:"id"`
	Name  string  `json:"name"`
	Image *string `json:"image"`
}

// InstructorInfo represents instructor details used across modules.
type InstructorInfo struct {
	ID       string  `json:"id"`
	Name     string  `json:"name"`
	Image    *string `json:"image"`
	Headline *string `json:"headline,omitempty"`
}

// CategoryInfo represents basic category/subcategory details.
type CategoryInfo struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

// CourseInfo represents basic course details used across modules.
type CourseInfo struct {
	ID        string  `json:"id" db:"id"`
	Title     string  `json:"title" db:"title"`
	Thumbnail *string `json:"thumbnail" db:"thumbnail"`
}

// CouponInfo represents basic coupon details used across modules.
type CouponInfo struct {
	ID            string  `json:"id"`
	Code          string  `json:"code"`
	DiscountValue float64 `json:"discount_value"`
}

// UserContext holds the authenticated user's identity, extracted from the JWT.
type UserContext struct {
	UserID      string   `json:"user_id"`
	Email       string   `json:"email"`
	Roles       []string `json:"roles"`
	Permissions map[string]struct{}
}

type UserClaims struct {
	jwt.RegisteredClaims
	Email       string   `json:"email"`
	Roles       []string `json:"roles"`
	Permissions []string `json:"permissions"`
	Banned      bool     `json:"banned"`
}

// DeleteResponse represents the generic response envelope returned when a resource is deleted.
type DeleteResponse struct {
	ID string `json:"id"`
}

type SuccessResponse struct {
	Success bool `json:"success"`
}

type Response[T any] struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Data    T      `json:"data,omitempty"`
	Error   string `json:"error,omitempty"`
}
