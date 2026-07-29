package entities

type Role struct {
	ID          int     `json:"id" db:"id"`
	Name        string  `json:"name" db:"name"`
	Description *string `json:"description,omitempty" db:"description"`
	IsSystem    bool    `json:"is_system" db:"is_system"`
}

type Permission struct {
	ID          int     `json:"id" db:"id"`
	Name        string  `json:"name" db:"name"`
	Description *string `json:"description,omitempty" db:"description"`
}

type CreateRoleRequest struct {
	Name        string  `json:"name" validate:"required"`
	Description *string `json:"description,omitempty"`
}

type UpdateRoleRequest struct {
	Name        *string `json:"name,omitempty"`
	Description *string `json:"description,omitempty"`
}

type UpdateRolePermissionsRequest struct {
	PermissionIDs []int `json:"permission_ids" validate:"required"`
}
