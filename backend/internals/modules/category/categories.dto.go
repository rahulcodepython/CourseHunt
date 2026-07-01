package category

// ── Categories ──

type CreateCategoryRequest struct {
	Name     string  `json:"name" validate:"required,min=2,max=100"`
	ParentID *string `json:"parent_id"`
}

type UpdateCategoryRequest struct {
	Name string `json:"name" validate:"required,min=2,max=100"`
}
