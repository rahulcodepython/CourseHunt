package utils

// SwaggerResponse represents a generic JSON API response with standard envelope.
type SwaggerResponse[T any] struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Data    T      `json:"data"`
	Errors  any    `json:"errors,omitempty"`
}

// SwaggerBasicResponse represents a generic success/error response.
type SwaggerBasicResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data"`
	Errors  interface{} `json:"errors,omitempty"`
}
