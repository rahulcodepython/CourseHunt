package lessons

import (
	"context"

	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/pkg/postgres"
)

func (a *App) CreateResourceRepository(ctx context.Context, lessonID, tutorID string, req AddResourceRequest) (*LessonResource, error) {
	var (
		courseTutorID *string
		insertedData  []byte
	)

	err := a.DB.QueryRow(ctx, CreateResource, lessonID, req.Title, req.FileURL, req.FileType, tutorID).Scan(
		&courseTutorID, &insertedData,
	)
	if err != nil {
		return nil, postgres.MapPgError(err)
	}

	if err := postgres.CheckConditions(
		postgres.Condition{Failed: courseTutorID == nil, Err: generic.ErrLessonsLessonNotFound},
		postgres.Condition{Failed: len(insertedData) == 0 || string(insertedData) == "null", Err: generic.ErrLessonsAccessDenied},
	); err != nil {
		return nil, err
	}

	return postgres.DecodeJSON[LessonResource](insertedData)
}

func (a *App) DeleteResourceRepository(ctx context.Context, resourceID, tutorID string) (string, string, error) {
	var (
		courseTutorID *string
		deletedID     *string
		deletedFile   *string
	)

	err := a.DB.QueryRow(ctx, DeleteResource, resourceID, tutorID).Scan(
		&courseTutorID, &deletedID, &deletedFile,
	)
	if err != nil {
		return "", "", postgres.MapPgError(err)
	}

	if err := postgres.CheckConditions(
		postgres.Condition{Failed: courseTutorID == nil, Err: generic.ErrLessonsResourceNotFound},
		postgres.Condition{Failed: deletedID == nil, Err: generic.ErrLessonsAccessDenied},
	); err != nil {
		return "", "", err
	}

	fileURL := ""
	if deletedFile != nil {
		fileURL = *deletedFile
	}
	return *deletedID, fileURL, nil
}

func (a *App) ReadResourcesForTutorRepository(ctx context.Context, lessonID, tutorID string) ([]LessonResource, error) {
	var (
		lessonExists bool
		isOwner      bool
		resources    []byte
	)

	err := a.DB.QueryRow(ctx, ReadResourcesForTutor, lessonID, tutorID).Scan(
		&lessonExists, &isOwner, &resources,
	)
	if err != nil {
		return nil, postgres.MapPgError(err)
	}

	if err := postgres.CheckConditions(
		postgres.Condition{Failed: !lessonExists, Err: generic.ErrLessonsLessonNotFound},
		postgres.Condition{Failed: !isOwner, Err: generic.ErrLessonsAccessDenied},
	); err != nil {
		return nil, err
	}

	return postgres.DecodeJSONSlice[LessonResource](resources)
}

func (a *App) ReadResourcesRepository(ctx context.Context, lessonID, userID string, scope generic.AuthScope) ([]LessonResource, error) {
	if scope == generic.ScopeAdmin {
		return postgres.QueryJSONSlice[LessonResource](ctx, a.DB, ReadResourcesAdmin, lessonID)
	}

	var (
		lessonExists bool
		isEnrolled   bool
		resources    []byte
	)

	err := a.DB.QueryRow(ctx, ReadResourcesScoped, lessonID, userID).Scan(
		&lessonExists, &isEnrolled, &resources,
	)
	if err != nil {
		return nil, postgres.MapPgError(err)
	}

	if err := postgres.CheckConditions(
		postgres.Condition{Failed: !lessonExists, Err: generic.ErrLessonsLessonNotFound},
		postgres.Condition{Failed: !isEnrolled, Err: generic.ErrLessonsNotEnrolled},
	); err != nil {
		return nil, err
	}

	return postgres.DecodeJSONSlice[LessonResource](resources)
}
