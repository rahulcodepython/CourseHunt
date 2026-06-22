package users

func (m *UsersModule) ReadService(id string) (*User, error) {
	return m.ReadRepository(id)
}

func (m *UsersModule) ListService(page, limit int, search, role string) ([]UserListItem, int, error) {
	return m.ListRepository(page, limit, search, role)
}

func (m *UsersModule) AssignRoleService(userID string, roleID int) error {
	return m.AssignRoleRepository(userID, roleID)
}

func (m *UsersModule) DeleteRoleService(userID string, roleID int) error {
	return m.DeleteRoleRepository(userID, roleID)
}
