package models

// PaginatedResponse is a generic paginated list wrapper.
type PaginatedResponse struct {
	Data  interface{} `json:"data"`
	Total int         `json:"total"`
	Page  int         `json:"page"`
	Limit int         `json:"limit"`
}
