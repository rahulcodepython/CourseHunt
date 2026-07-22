package users

import (
	"encoding/json"
	"fmt"
	"strings"
)

func (m *UsersModule) AssignRoleRepository(userID string, roleID int) error {
	_, err := m.DB.Exec(`INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, userID, roleID)
	return err
}

func (m *UsersModule) DeleteRoleRepository(userID string, roleID int) error {
	_, err := m.DB.Exec(`DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2`, userID, roleID)
	return err
}

func (m *UsersModule) ListRepository(page, limit int, name, email, role string) ([]UserListResponse, int, error) {
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
		where = append(where, fmt.Sprintf("EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = u.id AND r.name = $%d)", idx))
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

	err := m.DB.Get(&result, fmt.Sprintf(`
		WITH count_cte AS (
			SELECT COUNT(*) AS total
			FROM "user" u
			%s
		),
		data_cte AS (
			SELECT 
				u.id, u.name, u.email, u.image, u.email_verified AS "emailVerified", u.banned, u.created_at AS "createdAt", u.updated_at AS "updatedAt",
				COALESCE(
					(SELECT json_agg(json_build_object('id', r.id, 'name', r.name) ORDER BY r.id)
					 FROM user_roles ur
					 JOIN roles r ON r.id = ur.role_id
					 WHERE ur.user_id = u.id),
					'[]'::json
				) AS roles
			FROM "user" u
			%s
			ORDER BY u.created_at DESC
			LIMIT $1 OFFSET $2
		)
		SELECT 
			COALESCE((SELECT total FROM count_cte), 0) AS total,
			COALESCE((SELECT json_agg(row_to_json(data_cte.*)) FROM data_cte), '[]'::json) AS data
	`, whereClause, whereClause), args...)

	if err != nil {
		return nil, 0, err
	}

	var list []UserListResponse
	if err := json.Unmarshal(result.Data, &list); err != nil {
		return nil, 0, err
	}

	return list, result.Total, nil
}

func (m *UsersModule) ClearPasswordChangedAtRepository(userID string) error {
	_, err := m.DB.Exec(`UPDATE "user" SET "passwordChangedAt" = NOW() WHERE id = $1`, userID)
	return err
}
