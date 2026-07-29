package roles

import (
	"fmt"
	"strings"
)

func (m *RolesModule) ListRolesRepository() ([]Role, error) {
	var roles []Role
	err := m.DB.Select(&roles, `SELECT id, name, description, is_system FROM roles ORDER BY id`)
	return roles, err
}

func (m *RolesModule) CreateRoleRepository(req CreateRoleRequest) (*Role, error) {
	var role Role
	err := m.DB.Get(&role,
		`INSERT INTO roles (name, description) VALUES ($1, $2)
		 RETURNING id, name, description, is_system`,
		req.Name, req.Description,
	)
	if err != nil {
		return nil, err
	}
	return &role, nil
}

func (m *RolesModule) GetRoleRepository(roleID int) (*Role, error) {
	var role Role
	err := m.DB.Get(&role,
		`SELECT id, name, description, is_system FROM roles WHERE id = $1`,
		roleID,
	)
	if err != nil {
		return nil, err
	}
	return &role, nil
}

func (m *RolesModule) UpdateRoleRepository(roleID int, req UpdateRoleRequest) (*Role, error) {
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
		return m.GetRoleRepository(roleID)
	}

	args = append(args, roleID)
	query := fmt.Sprintf(
		`UPDATE roles SET %s WHERE id = $%d RETURNING id, name, description, is_system`,
		strings.Join(setClauses, ", "), idx,
	)

	var role Role
	err := m.DB.Get(&role, query, args...)
	if err != nil {
		return nil, err
	}
	return &role, nil
}

func (m *RolesModule) DeleteRoleRepository(roleID int) (string, error) {
	var deletedID int
	err := m.DB.Get(&deletedID, `
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
	return fmt.Sprintf("%d", deletedID), nil
}

func (m *RolesModule) GetRolePermissionsRepository(roleID int) ([]Permission, error) {
	var permissions []Permission
	err := m.DB.Select(&permissions,
		`SELECT p.id, p.name, p.description
		 FROM permissions p
		 INNER JOIN role_permissions rp ON rp.permission_id = p.id
		 WHERE rp.role_id = $1
		 ORDER BY p.id`,
		roleID,
	)
	return permissions, err
}

func (m *RolesModule) SetRolePermissionsRepository(roleID int, permissionIDs []int) error {
	tx, err := m.DB.Beginx()
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
			idx := i*2 + 2
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

func (m *RolesModule) ListPermissionsRepository() ([]Permission, error) {
	var permissions []Permission
	err := m.DB.Select(&permissions, `SELECT id, name, description FROM permissions ORDER BY id`)
	return permissions, err
}
