package dashboard

import (
	"context"

	"coursehunt/server/internals/utils"
)

func (a *App) UserDashboard(ctx context.Context, userID string) (*UserDashboard, error) {
	d, err := a.UserDashboardRepository(ctx, userID)
	if err != nil {
		return nil, utils.ErrInternal("Failed to fetch user dashboard.", err)
	}
	return d, nil
}

func (a *App) TutorDashboard(ctx context.Context, tutorID string) (*TutorDashboard, error) {
	d, err := a.TutorDashboardRepository(ctx, tutorID)
	if err != nil {
		return nil, utils.ErrInternal("Failed to fetch tutor dashboard.", err)
	}
	return d, nil
}

func (a *App) AdminDashboard(ctx context.Context) (*AdminDashboard, error) {
	d, err := a.AdminDashboardRepository(ctx)
	if err != nil {
		return nil, utils.ErrInternal("Failed to fetch admin dashboard.", err)
	}
	return d, nil
}
