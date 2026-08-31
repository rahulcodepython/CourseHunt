package courses

import (
	"context"
	"errors"

	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/pkg/postgres"
)

var (
	enrollFreeErrMap = postgres.StatusErrorMap{
		0: generic.ErrCoursesCourseNotFound,
		1: generic.ErrCoursesNotFree,
	}
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

	if err := postgres.CheckConditions(
		postgres.Condition{Failed: !courseExists, Err: generic.ErrCoursesCourseNotFound},
		postgres.Condition{Failed: !isEnrolled, Err: generic.ErrCoursesNotEnrolled},
		postgres.Condition{Failed: len(studyData) == 0 || string(studyData) == "null", Err: errors.New("failed to fetch study data")},
	); err != nil {
		return nil, err
	}

	return postgres.DecodeJSON[CourseStudyResponse](studyData)
}

func (a *App) EnrollFreeRepository(ctx context.Context, userID, courseID string) error {
	return postgres.QueryStatusOnly(
		ctx,
		a.DB,
		EnrollFree,
		enrollFreeErrMap,
		courseID, userID,
	)
}

type EnrolledListPayload struct {
	Total int                      `json:"total"`
	Data  []EnrolledCourseResponse `json:"data"`
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
