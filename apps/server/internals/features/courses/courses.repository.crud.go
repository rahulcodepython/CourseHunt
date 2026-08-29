package courses

import (
	"context"

	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/pkg/postgres"
	"coursehunt/server/internals/utils"
)

func (a *App) CreateRepository(ctx context.Context, tutorID string, req CreateCourseRequest) (*Course, error) {
	slug := utils.Slugify(req.Title)

	return postgres.QueryJSON[Course](
		ctx,
		a.DB,
		CreateCourse,
		tutorID, slug, req.Title, req.ShortDescription, req.LongDescription, req.ImageURL, req.PreviewVideoURL,
		req.CategoryID, req.Language, req.Level, req.ActualPrice, req.FinalPrice,
		req.Benefits, req.Requirements, req.CouponAllowed, req.IsFree,
	)
}

func (a *App) UpdateRepository(ctx context.Context, id, tutorID string, req UpdateCourseRequest) (*Course, *CourseFileCleanup, error) {
	var (
		dbTutorID          *string
		oldImageURL        *string
		oldPreviewVideoURL *string
		updatedData        []byte
	)

	err := a.DB.QueryRow(
		ctx,
		UpdateCourse,
		id, tutorID, req.Title, req.ShortDescription, req.LongDescription,
		req.ImageURL, req.PreviewVideoURL, req.Language, req.Level, req.ActualPrice,
		req.FinalPrice, req.Benefits, req.Requirements, req.CategoryID, req.CouponAllowed,
		req.IsFree, req.Status,
	).Scan(&dbTutorID, &oldImageURL, &oldPreviewVideoURL, &updatedData)
	if err != nil {
		return nil, nil, postgres.MapPgError(err)
	}

	if err := postgres.CheckConditions(
		postgres.Condition{Failed: dbTutorID == nil, Err: generic.ErrCoursesCourseNotFound},
		postgres.Condition{Failed: len(updatedData) == 0 || string(updatedData) == "null", Err: generic.ErrCoursesAccessDenied},
	); err != nil {
		return nil, nil, err
	}

	c, err := postgres.DecodeJSON[Course](updatedData)
	if err != nil {
		return nil, nil, err
	}
	cleanup := &CourseFileCleanup{
		OldImageURL:        oldImageURL,
		OldPreviewVideoURL: oldPreviewVideoURL,
	}
	return c, cleanup, nil
}

func (a *App) DeleteRepository(ctx context.Context, id, tutorID string) (string, error) {
	var (
		dbTutorID *string
		deletedID *string
	)

	err := a.DB.QueryRow(ctx, DeleteCourse, id, tutorID).Scan(&dbTutorID, &deletedID)
	if err != nil {
		return "", postgres.MapPgError(err)
	}

	if err := postgres.CheckConditions(
		postgres.Condition{Failed: dbTutorID == nil, Err: generic.ErrCoursesCourseNotFound},
		postgres.Condition{Failed: deletedID == nil, Err: generic.ErrCoursesAccessDenied},
	); err != nil {
		return "", err
	}

	return *deletedID, nil
}
