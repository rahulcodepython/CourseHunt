package certificates

import (
	"context"
	"errors"

	"coursehunt/server/internals/pkg/postgres"
)

type CertificatesListPayload struct {
	Total int           `json:"total"`
	Data  []Certificate `json:"data"`
}

func (a *App) IssueRepository(ctx context.Context, userID, courseID string) (*Certificate, error) {
	return postgres.QueryWithStatus[Certificate](ctx, a.DB, IssueCertificateJSON, IssueCertificateErrMap, userID, courseID)
}

func (a *App) ListRepository(ctx context.Context, userID string, page, limit int) ([]Certificate, int, error) {
	offset := (page - 1) * limit

	result, err := postgres.QueryJSON[CertificatesListPayload](
		ctx,
		a.DB,
		ListCertificatesJSON,
		userID,
		limit,
		offset,
	)
	if err != nil {
		return nil, 0, err
	}
	if result == nil {
		return []Certificate{}, 0, nil
	}
	if result.Data == nil {
		result.Data = []Certificate{}
	}
	return result.Data, result.Total, nil
}

// VerifyRepository is the public, unauthenticated lookup used by a certificate's QR code.
// A bad/tampered/fake ID is an expected input here, not a failure — the query has no
// EXISTS-wrapping to guarantee a row back, so a nonexistent ID surfaces as
// postgres.ErrNotFound (zero rows) rather than a nil result; that case is the normal
// "not a valid certificate" outcome and must resolve to {Valid: false}, not an error.
func (a *App) VerifyRepository(ctx context.Context, id string) (*CertificateVerification, error) {
	verification, err := postgres.QueryJSON[CertificateVerification](ctx, a.DB, VerifyCertificateJSON, id)
	if err != nil {
		if errors.Is(err, postgres.ErrNotFound) {
			return &CertificateVerification{Valid: false}, nil
		}
		return nil, err
	}
	if verification == nil {
		return &CertificateVerification{Valid: false}, nil
	}
	verification.Valid = true
	return verification, nil
}
