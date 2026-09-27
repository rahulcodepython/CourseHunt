package courses

import (
	"context"
	"errors"

	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/pkg/postgres"

	"github.com/jackc/pgx/v5"
)

func (a *App) StudyMetadataRepository(ctx context.Context, courseID, userID string) (*CourseStudyResponse, error) {
	var (
		courseExists bool
		isEnrolled   bool
		studyData    []byte
	)

	err := a.DB.QueryRow(ctx, StudyMetadata, courseID, userID).Scan(&courseExists, &isEnrolled, &studyData)
	if err != nil {
		return nil, postgres.MapPgError(err)
	}

	if !courseExists {
		return nil, generic.ErrCoursesCourseNotFound
	}
	if !isEnrolled {
		return nil, generic.ErrCoursesNotEnrolled
	}
	if len(studyData) == 0 || string(studyData) == "null" {
		return nil, errors.New("failed to fetch study data")
	}

	return postgres.DecodeJSON[CourseStudyResponse](studyData)
}

func (a *App) EnrollFreeRepository(ctx context.Context, userID, courseID string) error {
	var isFree bool
	err := a.DB.QueryRow(ctx, "SELECT is_free FROM courses WHERE id = $1", courseID).Scan(&isFree)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return generic.ErrCoursesCourseNotFound
		}
		return postgres.MapPgError(err)
	}
	if !isFree {
		return generic.ErrCoursesNotFree
	}

	var alreadyEnrolled bool
	err = a.DB.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM enrollments WHERE user_id = $1 AND course_id = $2 AND revoked = false)", userID, courseID).Scan(&alreadyEnrolled)
	if err != nil {
		return postgres.MapPgError(err)
	}
	if alreadyEnrolled {
		return nil
	}

	tx, err := a.DB.Begin(ctx)
	if err != nil {
		return postgres.MapPgError(err)
	}
	defer tx.Rollback(ctx)

	_, err = tx.Exec(ctx, `
		INSERT INTO enrollments (user_id, course_id, revoked)
		VALUES ($1, $2, false)
		ON CONFLICT (user_id, course_id) DO UPDATE SET revoked = false
	`, userID, courseID)
	if err != nil {
		return postgres.MapPgError(err)
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO transactions (user_id, course_id, amount, currency, status, confirmed_at)
		VALUES ($1, $2, 0, 'INR', 'success', CURRENT_TIMESTAMP)
	`, userID, courseID)
	if err != nil {
		return postgres.MapPgError(err)
	}

	return tx.Commit(ctx)
}

func (a *App) EnrolledCoursesRepository(ctx context.Context, userID string, page, limit int) ([]EnrolledCourseResponse, int, error) {
	offset := (page - 1) * limit

	result, err := postgres.QueryJSON[EnrolledListPayload](
		ctx,
		a.DB,
		EnrolledCoursesJSON,
		userID,
		limit,
		offset,
	)
	if err != nil {
		return nil, 0, err
	}
	if result == nil {
		return []EnrolledCourseResponse{}, 0, nil
	}
	if result.Data == nil {
		result.Data = []EnrolledCourseResponse{}
	}
	return result.Data, result.Total, nil
}
