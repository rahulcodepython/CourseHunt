package repositories

import (
	"coursehunt/server/internals/entities"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"
)

type UsersRepository struct {
	DB *sqlx.DB
}

func NewUsersRepository(db *sqlx.DB) *UsersRepository {
	return &UsersRepository{DB: db}
}

// RolesAndPermissionsResult holds the current segment, roles, and
// permissions resolved from the database for a given user.
type RolesAndPermissionsResult struct {
	Role        string   `db:"role"`
	Roles       []string `db:"roles"`
	Permissions []string `db:"permissions"`
}

// GetRolesAndPermissions resolves the user's current segment (users.role),
// custom roles, and permissions from the database. Unlike the JWT claims (a
// snapshot taken at token mint time), this is always fresh, so role/
// permission changes apply immediately.
func (r *UsersRepository) GetRolesAndPermissions(userID string) (RolesAndPermissionsResult, error) {
	var result struct {
		Role        string          `db:"role"`
		Roles       json.RawMessage `db:"roles"`
		Permissions json.RawMessage `db:"permissions"`
	}

	err := r.DB.Get(&result, `
		SELECT
			COALESCE(u.role, '') AS role,
			COALESCE(
				(SELECT json_agg(DISTINCT r.name)
				 FROM roles_user ru
				 JOIN roles r ON r.id = ru.role_id
				 WHERE ru.user_id = $1), '[]'::json
			) AS roles,
			COALESCE(
				(SELECT json_agg(DISTINCT p.id)
				 FROM roles_user ru
				 JOIN role_permissions rp ON rp.role_id = ru.role_id
				 JOIN permissions p ON p.id = rp.permission_id
				 WHERE ru.user_id = $1), '[]'::json
			) AS permissions
		FROM "users" u
		WHERE u.id = $1
	`, userID)
	if err != nil {
		return RolesAndPermissionsResult{}, err
	}

	out := RolesAndPermissionsResult{Role: result.Role}
	if err := json.Unmarshal(result.Roles, &out.Roles); err != nil {
		return RolesAndPermissionsResult{}, err
	}
	if err := json.Unmarshal(result.Permissions, &out.Permissions); err != nil {
		return RolesAndPermissionsResult{}, err
	}
	return out, nil
}

func (r *UsersRepository) AssignRoleRepository(userID string, roleIDs []string) error {
	_, err := r.DB.Exec(`
		INSERT INTO roles_user (user_id, role_id)
		SELECT $1, unnest($2::uuid[])
		ON CONFLICT DO NOTHING`, userID, pq.Array(roleIDs))
	return err
}

func (r *UsersRepository) DeleteRoleRepository(userID string, roleIDs []string) error {
	_, err := r.DB.Exec(`DELETE FROM roles_user WHERE user_id = $1 AND role_id = ANY($2::uuid[])`, userID, pq.Array(roleIDs))
	return err
}

func (r *UsersRepository) ListRepository(page, limit int, name, email, role string) ([]entities.UserListResponse, int, error) {
	offset := (page - 1) * limit

	var where []string
	args := []any{limit, offset}
	idx := 3

	if name != "" {
		where = append(where, fmt.Sprintf("u.name ILIKE $%d", idx))
		args = append(args, "%"+name+"%")
		idx++
	}
	if email != "" {
		where = append(where, fmt.Sprintf("u.email ILIKE $%d", idx))
		args = append(args, "%"+email+"%")
		idx++
	}
	if role != "" {
		where = append(where, fmt.Sprintf("(u.role = $%d OR EXISTS (SELECT 1 FROM roles_user ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = u.id AND r.name = $%d))", idx, idx))
		args = append(args, role)
		idx++
	}

	whereClause := ""
	if len(where) > 0 {
		whereClause = "WHERE " + strings.Join(where, " AND ")
	}

	var result struct {
		Total int             `db:"total"`
		Data  json.RawMessage `db:"data"`
	}

	err := r.DB.Get(&result, fmt.Sprintf(`
		WITH roles_user_agg AS (
			SELECT ur.user_id,
				   json_agg(json_build_object('id', r.id, 'name', r.name) ORDER BY r.name) AS roles
			FROM roles_user ur
			JOIN roles r ON r.id = ur.role_id
			GROUP BY ur.user_id
		),
		count_cte AS (
			SELECT COUNT(*) AS total
			FROM "users" u
			%s
		),
		data_cte AS (
			SELECT 
				u.id, u.name, u.email, u.image, u.role, u."emailVerified" AS email_verified, u.banned, u."createdAt" AS created_at, u."updatedAt" AS updated_at,
				COALESCE(ura.roles, '[]'::json) AS roles
			FROM "users" u
			LEFT JOIN roles_user_agg ura ON ura.user_id = u.id
			%s
			ORDER BY u."createdAt" DESC
			LIMIT $1 OFFSET $2
		)
		SELECT 
			COALESCE((SELECT total FROM count_cte), 0) AS total,
			COALESCE((SELECT json_agg(data_cte) FROM data_cte), '[]'::json) AS data
	`, whereClause, whereClause), args...)

	if err != nil {
		return nil, 0, err
	}

	var list []entities.UserListResponse
	if err := json.Unmarshal(result.Data, &list); err != nil {
		return nil, 0, err
	}

	return list, result.Total, nil
}
