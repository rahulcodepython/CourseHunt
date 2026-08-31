package enrollments

import (
	"context"
	"errors"

	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/utils"
)

func (a *App) AdminList(ctx context.Context, page, limit int, courseID, targetUserID, userName, userEmail, revoked string) ([]ListEnrollmentResponse, int, error) {
	list, total, err := a.AdminListRepository(ctx, page, limit, courseID, targetUserID, userName, userEmail, revoked)
	if err != nil {
		return nil, 0, utils.ErrInternal("Failed to fetch enrollments.", err)
	}
	return list, total, nil
}

func (a *App) TutorList(ctx context.Context, page, limit int, courseID, callerID, userName, userEmail, revoked string) ([]ListEnrollmentResponse, int, error) {
	list, total, err := a.TutorListRepository(ctx, page, limit, courseID, callerID, userName, userEmail, revoked)
	if err != nil {
		if errors.Is(err, generic.ErrEnrollmentsAccessDenied) {
			return nil, 0, utils.ErrForbidden("Access denied. You do not own this course.", err)
		}
		return nil, 0, utils.ErrInternal("Failed to fetch enrollments.", err)
	}
	return list, total, nil
}

func (a *App) Revoke(ctx context.Context, userID, courseID string) error {
	if err := a.RevokeRepository(ctx, userID, courseID); err != nil {
		return utils.ErrInternal("Failed to revoke course access.", err)
	}
	return nil
}

func (a *App) Regain(ctx context.Context, userID, courseID string) error {
	if err := a.RegainRepository(ctx, userID, courseID); err != nil {
		return utils.ErrInternal("Failed to regain course access.", err)
	}
	return nil
}
