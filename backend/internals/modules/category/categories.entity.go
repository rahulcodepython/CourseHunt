package category

import "time"

type Category struct {
	ID            string     `json:"id"`
	ParentID      *string    `json:"parent_id,omitempty"`
	Name          string     `json:"name"`
	CreatedAt     time.Time  `json:"created_at"`
	Subcategories []Category `json:"subcategories,omitempty"`
}
