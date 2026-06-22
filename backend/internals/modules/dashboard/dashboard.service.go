package dashboard

func (m *DashboardModule) UserDashboardService(userID string) (*UserDashboard, error) {
	return m.UserDashboardRepository(userID)
}

func (m *DashboardModule) TutorDashboardService(tutorID string) (*TutorDashboard, error) {
	return m.TutorDashboardRepository(tutorID)
}

func (m *DashboardModule) AdminDashboardService() (*AdminDashboard, error) {
	return m.AdminDashboardRepository()
}
