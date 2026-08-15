package repositories

import (
	"coursehunt/server/internals/entities"
	"coursehunt/server/internals/pkg/cache"
	"fmt"
	"strings"

	"github.com/jmoiron/sqlx"
)

type RolesRepository struct {
	DB    *sqlx.DB
	Cache *cache.Cache
}

func NewRolesRepository(db *sqlx.DB, cache *cache.Cache) *RolesRepository {
	return &RolesRepository{DB: db, Cache: cache}
}

func (r *RolesRepository) ListRolesRepository() ([]entities.Role, error) {
	var roles []entities.Role
	err := r.DB.Select(&roles, `SELECT id, name, description, is_system FROM roles ORDER BY name`)
	return roles, err
}

func (r *RolesRepository) CreateRoleRepository(req entities.CreateRoleRequest) (*entities.Role, error) {
	var role entities.Role
	err := r.DB.Get(&role,
		`INSERT INTO roles (name, description) VALUES ($1, $2)
		 RETURNING id, name, description, is_system`,
		req.Name, req.Description,
	)
	if err != nil {
		return nil, err
	}
	return &role, nil
}

func (r *RolesRepository) GetRoleRepository(roleID string) (*entities.Role, error) {
	var role entities.Role
	err := r.DB.Get(&role,
		`SELECT id, name, description, is_system FROM roles WHERE id = $1`,
		roleID,
	)
	if err != nil {
		return nil, err
	}
	return &role, nil
}

func (r *RolesRepository) UpdateRoleRepository(roleID string, req entities.UpdateRoleRequest) (*entities.Role, error) {
	var setClauses []string
	args := []any{}
	idx := 1

	if req.Name != nil {
		setClauses = append(setClauses, fmt.Sprintf("name = $%d", idx))
		args = append(args, *req.Name)
		idx++
	}
	if req.Description != nil {
		setClauses = append(setClauses, fmt.Sprintf("description = $%d", idx))
		args = append(args, *req.Description)
		idx++
	}

	if len(setClauses) == 0 {
		return r.GetRoleRepository(roleID)
	}

	args = append(args, roleID)
	query := fmt.Sprintf(
		`UPDATE roles SET %s WHERE id = $%d RETURNING id, name, description, is_system`,
		strings.Join(setClauses, ", "), idx,
	)

	var role entities.Role
	err := r.DB.Get(&role, query, args...)
	if err != nil {
		return nil, err
	}
	return &role, nil
}

func (r *RolesRepository) DeleteRoleRepository(roleID string) (string, error) {
	var deletedID string
	err := r.DB.Get(&deletedID, `
		WITH del_perms AS (
			DELETE FROM role_permissions WHERE role_id = $1 RETURNING 1
		),
		del_role AS (
			DELETE FROM roles WHERE id = $1 RETURNING id
		)
		SELECT id FROM del_role
	`, roleID)
	if err != nil {
		return "", err
	}
	return deletedID, nil
}

func (r *RolesRepository) GetRolePermissionsRepository(roleID string) ([]entities.Permission, error) {
	var permissions []entities.Permission
	err := r.DB.Select(&permissions,
		`SELECT p.id, p.name
		 FROM permissions p
		 INNER JOIN role_permissions rp ON rp.permission_id = p.id
		 WHERE rp.role_id = $1
		 ORDER BY p.name`,
		roleID,
	)
	return permissions, err
}

func (r *RolesRepository) SetRolePermissionsRepository(roleID string, permissionIDs []string) error {
	tx, err := r.DB.Beginx()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	_, err = tx.Exec(`DELETE FROM role_permissions WHERE role_id = $1`, roleID)
	if err != nil {
		return err
	}

	if len(permissionIDs) > 0 {
		values := []string{}
		args := []any{roleID}
		for i, pid := range permissionIDs {
			idx := i + 2
			values = append(values, fmt.Sprintf("($1, $%d)", idx))
			args = append(args, pid)
		}
		_, err = tx.Exec(
			fmt.Sprintf(`INSERT INTO role_permissions (role_id, permission_id) VALUES %s`, strings.Join(values, ", ")),
			args...,
		)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

func (r *RolesRepository) ListPermissionsRepository() ([]entities.Permission, error) {
	var permissions []entities.Permission
	err := r.DB.Select(&permissions, `SELECT id, name FROM permissions ORDER BY name`)
	return permissions, err
}
