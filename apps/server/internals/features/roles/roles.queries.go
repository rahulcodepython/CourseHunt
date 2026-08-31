package roles

import "fmt"

const (
	ListRoles = `
		SELECT COALESCE(
			jsonb_agg(
				jsonb_build_object(
					'id', sub.id,
					'name', sub.name,
					'description', sub.description,
					'is_system', sub.is_system,
					'permissions_count', sub.permissions_count
				) ORDER BY sub.name
			), '[]'::jsonb
		)
		FROM (
			SELECT
				r.id,
				r.name,
				r.description,
				r.is_system,
				COUNT(rp.permission_id) AS permissions_count
			FROM roles r
			LEFT JOIN role_permissions rp ON rp.role_id = r.id
			GROUP BY r.id, r.name, r.description, r.is_system
			ORDER BY r.name
		) sub;
	`

	CreateRole = `
		INSERT INTO roles (name, description) VALUES ($1, $2)
		RETURNING row_to_json(roles.*);
	`

	GetRole = `SELECT row_to_json(roles.*) FROM roles WHERE id = $1;`

	CountRoleAssignments = `SELECT COUNT(*) FROM roles_user WHERE role_id = $1;`

	DeleteRole = `
		WITH del_perms AS (
			DELETE FROM role_permissions WHERE role_id = $1 RETURNING 1
		),
		del_role AS (
			DELETE FROM roles WHERE id = $1 RETURNING id
		)
		SELECT id FROM del_role;
	`

	GetRolePermissions = `
		SELECT COALESCE(
			jsonb_agg(
				jsonb_build_object(
					'id', p.id,
					'name', p.name
				) ORDER BY p.name
			), '[]'::jsonb
		)
		FROM permissions p
		INNER JOIN role_permissions rp ON rp.permission_id = p.id
		WHERE rp.role_id = $1;
	`

	ListPermissions = `
		SELECT COALESCE(
			jsonb_agg(
				jsonb_build_object(
					'id', id,
					'name', name
				) ORDER BY name
			), '[]'::jsonb
		)
		FROM permissions;
	`

	DeleteRolePermissions = `DELETE FROM role_permissions WHERE role_id = $1;`
)

func BuildUpdateRoleQuery(setClauses string, idx int) string {
	return fmt.Sprintf(`UPDATE roles SET %s WHERE id = $%d RETURNING row_to_json(roles.*);`, setClauses, idx)
}

func BuildInsertRolePermissionsQuery(values string) string {
	return fmt.Sprintf(`INSERT INTO role_permissions (role_id, permission_id) VALUES %s;`, values)
}
