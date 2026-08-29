package enrollments

import (
	"context"
	"errors"

	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/utils"
)

func (a *App) List(ctx context.Context, scope generic.AuthScope, page, limit int, courseID, targetUserID, callerID, userName, userEmail, revoked string) ([]ListEnrollmentResponse, int, error) {
	list, total, err := a.ListRepository(ctx, scope, page, limit, courseID, targetUserID, callerID, userName, userEmail, revoked)
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

// IsEnrolled is the one exported method other features call across the
// feature boundary (transactions.InitiateService, to short-circuit before
// creating a payment order for a course the user is already enrolled in) —
// see enrollments.App threaded into transactions.New.
func (a *App) IsEnrolled(ctx context.Context, userID, courseID string) (bool, error) {
	return a.IsEnrolledRepository(ctx, userID, courseID)
}
