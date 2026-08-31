package certificates

import (
	"context"
	"errors"

	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/utils"
)

func (a *App) Claim(ctx context.Context, userID, courseID string) (*Certificate, error) {
	cert, err := a.IssueRepository(ctx, userID, courseID)
	if err != nil {
		if errors.Is(err, generic.ErrCertificateNotEnrolled) {
			return nil, utils.ErrForbidden("Access denied. Not enrolled in course.", err)
		}
		if errors.Is(err, generic.ErrCertificateNotCompleted) {
			return nil, utils.ErrForbidden("Course not completed.", err)
		}
		return nil, utils.ErrInternal("Failed to claim certificate.", err)
	}
	return cert, nil
}

func (a *App) List(ctx context.Context, userID string, page, limit int) ([]Certificate, int, error) {
	list, total, err := a.ListRepository(ctx, userID, page, limit)
	if err != nil {
		return nil, 0, utils.ErrInternal("Failed to fetch certificates.", err)
	}

	return list, total, nil
}

// Verify is the public, unauthenticated check backing a certificate's QR
// code — always returns a value (Valid=false for a bad id), never an
// APIError, so the handler always 200s.
func (a *App) Verify(ctx context.Context, id string) (*CertificateVerification, error) {
	verification, err := a.VerifyRepository(ctx, id)
	if err != nil {
		return nil, utils.ErrInternal("Failed to verify certificate.", err)
	}
	return verification, nil
}
