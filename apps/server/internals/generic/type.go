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
	ID    string  `json:"id" db:"id"`
	Name  string  `json:"name" db:"name"`
	Image *string `json:"image" db:"image"`
}

// InstructorInfo represents instructor details used across modules.
type InstructorInfo struct {
	ID    string  `json:"id" db:"id"`
	Name  string  `json:"name" db:"name"`
	Image *string `json:"image" db:"image"`
}

// CategoryInfo represents basic category/subcategory details.
type CategoryInfo struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

// CourseInfo represents basic course details used across modules. Slug is
// only populated by queries that actually select it (e.g. wishlist, for
// linking back to the public course page) — everywhere else it's left "".
type CourseInfo struct {
	ID        string  `json:"id" db:"id"`
	Slug      string  `json:"slug,omitempty" db:"slug"`
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
	UserID string `json:"user_id"`
	// Role is the account's segment (admin/tutor/user) — the better-auth
	// users.role field. Distinct from the plural Roles below.
	Role        string   `json:"role"`
	Roles       []string `json:"roles"`
	Permissions map[string]struct{}
}

type UserClaims struct {
	jwt.RegisteredClaims
	Role        string   `json:"role"`
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

// ── Razorpay Types ──

type RazorpayClient struct {
	KeyID         string
	Secret        string
	WebhookSecret string
	BaseURL       string
}

type RazorpayOrderRequest struct {
	Amount   int64  `json:"amount"`
	Currency string `json:"currency"`
	Receipt  string `json:"receipt"`
}

type RazorpayOrderResponse struct {
	ID       string `json:"id"`
	Entity   string `json:"entity"`
	Amount   int64  `json:"amount"`
	Currency string `json:"currency"`
	Receipt  string `json:"receipt"`
	Status   string `json:"status"`
}

// RazorpayWebhookPayload is the (small, relevant-fields-only) shape of a Razorpay
// payment webhook event body.
type RazorpayWebhookPayload struct {
	Event   string `json:"event"`
	Payload struct {
		Payment struct {
			Entity struct {
				ID               string `json:"id"`
				OrderID          string `json:"order_id"`
				Status           string `json:"status"`
				ErrorDescription string `json:"error_description"`
			} `json:"entity"`
		} `json:"payment"`
	} `json:"payload"`
}
