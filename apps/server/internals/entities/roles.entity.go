package entities

type Role struct {
	ID               string  `json:"id" db:"id"`
	Name             string  `json:"name" db:"name"`
	Description      *string `json:"description,omitempty" db:"description"`
	IsSystem         bool    `json:"is_system" db:"is_system"`
	PermissionsCount int     `json:"permissions_count" db:"permissions_count"`
}

type Permission struct {
	ID   string `json:"id" db:"id"`
	Name string `json:"name" db:"name"`
}

type CreateRoleRequest struct {
	Name        string  `json:"name" validate:"required,min=2,max=50"`
	Description *string `json:"description,omitempty" validate:"omitempty,max=500"`
}

type UpdateRoleRequest struct {
	Name        *string `json:"name,omitempty" validate:"omitempty,min=2,max=50"`
	Description *string `json:"description,omitempty" validate:"omitempty,max=500"`
}

type UpdateRolePermissionsRequest struct {
	PermissionIDs []string `json:"permission_ids" validate:"required,max=200,dive,uuid"`
}
