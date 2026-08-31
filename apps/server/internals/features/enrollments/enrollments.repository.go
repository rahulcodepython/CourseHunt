package enrollments

import (
	"context"

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

func (a *App) AdminListRepository(ctx context.Context, page, limit int, courseID, targetUserID, userName, userEmail, revoked string) ([]ListEnrollmentResponse, int, error) {
	offset := (page - 1) * limit
	filter := postgres.NewFilter(limit, offset)
	if courseID != "" {
		filter.Add("e.course_id = NULLIF($%d, '')::uuid", courseID)
	}
	if targetUserID != "" {
		filter.Add("e.user_id = NULLIF($%d, '')::uuid", targetUserID)
	}

	applyCommonFilters(filter, userName, userEmail, revoked)

	payload, err := postgres.QueryJSON[EnrollmentListPayload](ctx, a.DB, BuildAdminListQuery(filter.Join("1=1")), filter.Args...)
	if err != nil {
		return nil, 0, err
	}
	if payload == nil || payload.Data == nil {
		return []ListEnrollmentResponse{}, 0, nil
	}

	return payload.Data, payload.Total, nil
}

func (a *App) TutorListRepository(ctx context.Context, page, limit int, courseID, callerID, userName, userEmail, revoked string) ([]ListEnrollmentResponse, int, error) {
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

func applyCommonFilters(filter *postgres.QueryFilter, userName, userEmail, revoked string) {
	if userName != "" {
		filter.Add("u.name ILIKE $%d", "%"+userName+"%")
	}
	if userEmail != "" {
		filter.Add("u.email ILIKE $%d", "%"+userEmail+"%")
	}
	if revoked != "" {
		filter.Add("e.revoked = $%d::boolean", revoked)
	}
}
