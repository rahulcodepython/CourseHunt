package dashboard

import (
	"context"

	"coursehunt/server/internals/pkg/postgres"
)

func (a *App) UserDashboardRepository(ctx context.Context, userID string) (*UserDashboard, error) {
	d, err := postgres.QueryJSON[UserDashboard](ctx, a.DB, UserDashboardJSON, userID)
	if err != nil {
		return nil, err
	}
	if d == nil {
		d = &UserDashboard{}
	}
	if d.RecentCertificates == nil {
		d.RecentCertificates = []RecentCertificate{}
	}
	d.InProgressCoursesCount = d.EnrolledCoursesCount - d.CompletedCoursesCount
	return d, nil
}

func (a *App) TutorDashboardRepository(ctx context.Context, tutorID string) (*TutorDashboard, error) {
	d, err := postgres.QueryJSON[TutorDashboard](ctx, a.DB, TutorDashboardJSON, tutorID)
	if err != nil {
		return nil, err
	}
	if d == nil {
		d = &TutorDashboard{}
	}
	if d.CourseStats == nil {
		d.CourseStats = []TutorCourseStat{}
	}
	d.DraftCourses = d.TotalCourses - d.PublishedCourses
	return d, nil
}

func (a *App) AdminDashboardRepository(ctx context.Context) (*AdminDashboard, error) {
	d, err := postgres.QueryJSON[AdminDashboard](ctx, a.DB, AdminDashboardJSON)
	if err != nil {
		return nil, err
	}
	if d == nil {
		d = &AdminDashboard{}
	}
	if d.RecentTransactions == nil {
		d.RecentTransactions = []AdminRecentTransaction{}
	}
	if d.TopCourses == nil {
		d.TopCourses = []AdminTopCourse{}
	}
	if d.UserGrowth == nil {
		d.UserGrowth = []UserGrowth{}
	}
	return d, nil
}
