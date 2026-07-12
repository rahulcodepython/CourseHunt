package category

import (
	"time"
)

type Category struct {
	ID            string     `json:"id" db:"id"`
	ParentID      *string    `json:"parent_id,omitempty" db:"parent_id"`
	Name          string     `json:"name" db:"name"`
	CreatedAt     time.Time  `json:"created_at" db:"created_at"`
	Subcategories []Category `json:"subcategories,omitempty" db:"-"` // Ignore this field for flat SQL scans
}

// ── Categories ──

type CreateCategoryRequest struct {
	Name     string  `json:"name" validate:"required,min=2,max=100"`
	ParentID *string `json:"parent_id"`
}

type UpdateCategoryRequest struct {
	Name string `json:"name" validate:"required,min=2,max=100"`
}
