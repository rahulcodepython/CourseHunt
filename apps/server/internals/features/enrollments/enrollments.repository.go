package enrollments

import (
	"context"
	"fmt"

	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/pkg/postgres"
)

type EnrollmentListPayload struct {
	Total int                      `json:"total"`
	Data  []ListEnrollmentResponse `json:"data"`
}

func (a *App) RevokeRepository(ctx context.Context, userID, courseID string) error {
	return postgres.Exec(ctx, a.DB, RevokeEnrollment, userID, courseID)
}

func (a *App) RegainRepository(ctx context.Context, userID, courseID string) error {
	return postgres.Exec(ctx, a.DB, RegainEnrollment, userID, courseID)
}

func (a *App) ListRepository(ctx context.Context, scope generic.AuthScope, page, limit int, courseID, targetUserID, callerID, userName, userEmail, revoked string) ([]ListEnrollmentResponse, int, error) {
	offset := (page - 1) * limit

	if scope == generic.ScopeTutor {
		filter := postgres.NewFilter(courseID, callerID)
		applyCommonFilters(filter, userName, userEmail, revoked)

		limitIdx := filter.Paginate(page, limit)

		query := BuildTutorListQuery(filter.AndPrefix(), limitIdx)

		var (
			isOwner bool
			total   int
			data    []byte
		)

		err := a.DB.QueryRow(ctx, query, filter.Args...).Scan(&isOwner, &total, &data)
		if err != nil {
			return nil, 0, postgres.MapPgError(err)
		}

		if !isOwner {
			return nil, 0, generic.ErrEnrollmentsAccessDenied
		}

		list, err := postgres.DecodeJSONSlice[ListEnrollmentResponse](data)
		if err != nil {
			return nil, 0, err
		}

		return list, total, nil
	}

	filter := postgres.NewFilter(limit, offset)
	if courseID != "" {
		filter.Add("e.course_id = NULLIF($%d, '')::uuid", courseID)
	}
	if targetUserID != "" {
		filter.Add("e.user_id = NULLIF($%d, '')::uuid", targetUserID)
	}
	applyCommonFilters(filter, userName, userEmail, revoked)

	query := BuildAdminListQuery(filter.Join("1=1"))

	payload, err := postgres.QueryJSON[EnrollmentListPayload](ctx, a.DB, query, filter.Args...)
	if err != nil {
		return nil, 0, err
	}
	if payload == nil {
		return []ListEnrollmentResponse{}, 0, nil
	}
	if payload.Data == nil {
		payload.Data = []ListEnrollmentResponse{}
	}
	return payload.Data, payload.Total, nil
}

func applyCommonFilters(f *postgres.QueryFilter, userName, userEmail, revoked string) {
	if userName != "" {
		f.Add("u.name ILIKE $%d", "%"+userName+"%")
	}
	if userEmail != "" {
		f.Add("u.email ILIKE $%d", "%"+userEmail+"%")
	}
	if revoked == "true" || revoked == "false" {
		f.AddRaw(fmt.Sprintf("e.revoked = %s", revoked))
	}
}

func (a *App) IsEnrolledRepository(ctx context.Context, userID, courseID string) (bool, error) {
	var isEnrolled bool
	err := a.DB.QueryRow(ctx, IsEnrolled, userID, courseID).Scan(&isEnrolled)
	if err != nil {
		return false, postgres.MapPgError(err)
	}
	return isEnrolled, nil
}
