package category

// ── Categories ──

type CreateCategoryRequest struct {
	Name string `json:"name" validate:"required,min=2,max=100"`
}

type CreateSubcategoryRequest struct {
	Name string `json:"name" validate:"required,min=2,max=100"`
}
