package models

// PaginatedResponse is a generic paginated list wrapper.
type PaginatedResponse struct {
	Data  interface{} `json:"data"`
	Total int         `json:"total"`
	Page  int         `json:"page"`
	Limit int         `json:"limit"`
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
	ID        string  `json:"id"`
	Title     string  `json:"title"`
	Thumbnail *string `json:"thumbnail"`
}
