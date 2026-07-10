package utils

// SwaggerResponse represents a generic JSON API response with standard envelope.
type SwaggerResponse[T any] struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Data    T      `json:"data"`
	Errors  any    `json:"errors,omitempty"`
}

// PaginatedResponse represents a generic JSON API response with paginated data.
type PaginatedResponse[T any] struct {
	Success bool             `json:"success"`
	Message string           `json:"message"`
	Data    PaginatedData[T] `json:"data"`
}

// PaginatedData holds the paginated slice and pagination metadata.
type PaginatedData[T any] struct {
	Data  []T `json:"data"`
	Total int `json:"total"`
	Page  int `json:"page"`
	Limit int `json:"limit"`
}

// SwaggerBasicResponse represents a generic success/error response.
type SwaggerBasicResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data"`
	Errors  interface{} `json:"errors,omitempty"`
}

// DeleteResponse represents the generic response envelope returned when a resource is deleted.
type DeleteResponse struct {
	ID string `json:"id"`
}
