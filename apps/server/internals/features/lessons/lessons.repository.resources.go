package lessons

import (
	"context"

	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/pkg/postgres"
)

func (a *App) CreateResourceRepository(ctx context.Context, lessonID, tutorID string, req AddResourceRequest) (*LessonResource, error) {
	var (
		lessonExists bool
		isOwner      bool
		resourceData []byte
	)

	err := a.DB.QueryRow(
		ctx,
		CreateResource,
		lessonID, req.Title, req.FileURL, req.FileType, tutorID,
	).Scan(&lessonExists, &isOwner, &resourceData)
	if err != nil {
		return nil, postgres.MapPgError(err)
	}

	if err := postgres.CheckConditions(
		postgres.Condition{Failed: !lessonExists, Err: generic.ErrLessonsLessonNotFound},
		postgres.Condition{Failed: !isOwner, Err: generic.ErrLessonsAccessDenied},
	); err != nil {
		return nil, err
	}

	return postgres.DecodeJSON[LessonResource](resourceData)
}

func (a *App) DeleteResourceRepository(ctx context.Context, resourceID, tutorID string) (string, *string, error) {
	var (
		resourceExists bool
		isOwner        bool
		deletedID      *string
		oldFileURL     *string
	)

	err := a.DB.QueryRow(ctx, DeleteResource, resourceID, tutorID).Scan(
		&resourceExists, &isOwner, &deletedID, &oldFileURL,
	)
	if err != nil {
		return "", nil, postgres.MapPgError(err)
	}

	if err := postgres.CheckConditions(
		postgres.Condition{Failed: !resourceExists, Err: generic.ErrLessonsResourceNotFound},
		postgres.Condition{Failed: !isOwner, Err: generic.ErrLessonsAccessDenied},
	); err != nil {
		return "", nil, err
	}

	return *deletedID, oldFileURL, nil
}

func (a *App) ReadResourcesForTutorRepository(ctx context.Context, lessonID, tutorID string) ([]LessonResource, error) {
	var (
		lessonExists bool
		isOwner      bool
		data         []byte
	)

	err := a.DB.QueryRow(ctx, ReadResourcesForTutor, lessonID, tutorID).Scan(&lessonExists, &isOwner, &data)
	if err != nil {
		return nil, postgres.MapPgError(err)
	}

	if err := postgres.CheckConditions(
		postgres.Condition{Failed: !lessonExists, Err: generic.ErrLessonsLessonNotFound},
		postgres.Condition{Failed: !isOwner, Err: generic.ErrLessonsAccessDenied},
	); err != nil {
		return nil, err
	}

	return postgres.DecodeJSONSlice[LessonResource](data)
}

func (a *App) AdminReadResourcesRepository(ctx context.Context, lessonID string) ([]LessonResource, error) {
	var (
		lessonExists bool
		data         []byte
	)

	err := a.DB.QueryRow(ctx, ReadResourcesAdmin, lessonID).Scan(&lessonExists, &data)
	if err != nil {
		return nil, postgres.MapPgError(err)
	}

	if !lessonExists {
		return nil, generic.ErrLessonsLessonNotFound
	}

	return postgres.DecodeJSONSlice[LessonResource](data)
}

func (a *App) StudentReadResourcesRepository(ctx context.Context, lessonID, userID string) ([]LessonResource, error) {
	var (
		lessonExists bool
		isEnrolled   bool
		data         []byte
	)

	err := a.DB.QueryRow(ctx, ReadResourcesStudent, lessonID, userID).Scan(&lessonExists, &isEnrolled, &data)
	if err != nil {
		return nil, postgres.MapPgError(err)
	}

	if err := postgres.CheckConditions(
		postgres.Condition{Failed: !lessonExists, Err: generic.ErrLessonsLessonNotFound},
		postgres.Condition{Failed: !isEnrolled, Err: generic.ErrLessonsNotEnrolled},
	); err != nil {
		return nil, err
	}

	return postgres.DecodeJSONSlice[LessonResource](data)
}
