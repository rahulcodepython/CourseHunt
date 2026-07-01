package users

import "fmt"

func (m *UsersModule) ReadRepository(id string) (*User, error) {
	var u User
	err := m.DB.QueryRow(`SELECT id, name, email, "emailVerified", image, banned, "createdAt", "updatedAt" FROM "user" WHERE id = $1`, id).
		Scan(&u.ID, &u.Name, &u.Email, &u.EmailVerified, &u.Image, &u.Banned, &u.CreatedAt, &u.UpdatedAt)
	return &u, err
}

func (m *UsersModule) ListRepository(page, limit int, search, role string) ([]UserListResponse, int, error) {
	where := `1=1`
	args := []interface{}{}
	idx := 1

	if search != "" {
		where += fmt.Sprintf(` AND (u.name ILIKE $%d OR u.email ILIKE $%d)`, idx, idx)
		args = append(args, "%"+search+"%")
		idx++
	}
	if role != "" {
		where += fmt.Sprintf(` AND EXISTS (SELECT 1 FROM user_roles ur2 JOIN roles r2 ON r2.id = ur2.role_id WHERE ur2.user_id = u.id AND r2.name = $%d)`, idx)
		args = append(args, role)
		idx++
	}

	var total int
	m.DB.QueryRow(`SELECT COUNT(*) FROM "user" u WHERE `+where, args...).Scan(&total)

	offset := (page - 1) * limit
	args = append(args, limit, offset)
	rows, err := m.DB.Query(`
		SELECT u.id, u.name, u.email, u.image, u."emailVerified", u.banned, u."createdAt"
		FROM "user" u
		WHERE `+where+`
		ORDER BY u."createdAt" DESC LIMIT $`+fmt.Sprint(idx)+` OFFSET $`+fmt.Sprint(idx+1), args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var list []UserListResponse
	for rows.Next() {
		var u UserListResponse
		rows.Scan(&u.ID, &u.Name, &u.Email, &u.Image, &u.EmailVerified, &u.Banned, &u.CreatedAt)
		u.Roles, _ = m.GetRolesRepository(u.ID)
		list = append(list, u)
	}
	if list == nil {
		list = []UserListResponse{}
	}
	return list, total, rows.Err()
}

func (m *UsersModule) GetRolesRepository(userID string) ([]Role, error) {
	rows, err := m.DB.Query(`SELECT r.id, r.name FROM roles r JOIN user_roles ur ON ur.role_id = r.id WHERE ur.user_id = $1`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var roles []Role
	for rows.Next() {
		var role Role
		rows.Scan(&role.ID, &role.Name)
		roles = append(roles, role)
	}
	if roles == nil {
		roles = []Role{}
	}
	return roles, rows.Err()
}

func (m *UsersModule) AssignRoleRepository(userID string, roleID int) error {
	_, err := m.DB.Exec(`INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, userID, roleID)
	return err
}

func (m *UsersModule) DeleteRoleRepository(userID string, roleID int) error {
	_, err := m.DB.Exec(`DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2`, userID, roleID)
	return err
}
