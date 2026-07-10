package category

import (
	"time"
)

type Category struct {
	ID            string     `json:"id"`
	ParentID      *string    `json:"parent_id,omitempty"`
	Name          string     `json:"name"`
	CreatedAt     time.Time  `json:"created_at"`
	Subcategories []Category `json:"subcategories,omitempty"`
}

// ── Categories ──

type CreateCategoryRequest struct {
	Name     string  `json:"name" validate:"required,min=2,max=100"`
	ParentID *string `json:"parent_id"`
}

type UpdateCategoryRequest struct {
	Name string `json:"name" validate:"required,min=2,max=100"`
}
