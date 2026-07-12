package users

func (m *UsersModule) AssignRoleRepository(userID string, roleID int) error {
	_, err := m.DB.Exec(`INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, userID, roleID)
	return err
}

func (m *UsersModule) DeleteRoleRepository(userID string, roleID int) error {
	_, err := m.DB.Exec(`DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2`, userID, roleID)
	return err
}
