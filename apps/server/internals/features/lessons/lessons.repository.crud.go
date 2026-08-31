package lessons

import (
	"context"

	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/pkg/postgres"
)

func (a *App) AdminListRepository(ctx context.Context, chapterID string) ([]Lesson, error) {
	return postgres.QueryJSONSlice[Lesson](ctx, a.DB, ListAdmin, chapterID)
}

func (a *App) TutorListRepository(ctx context.Context, chapterID, userID string) ([]Lesson, error) {
	var (
		chapterExists bool
		isOwner       bool
		data          []byte
	)

	err := a.DB.QueryRow(ctx, ListScoped, chapterID, userID).Scan(&chapterExists, &isOwner, &data)
	if err != nil {
		return nil, postgres.MapPgError(err)
	}

	if err := postgres.CheckConditions(
		postgres.Condition{Failed: !chapterExists, Err: generic.ErrLessonsChapterNotFound},
		postgres.Condition{Failed: !isOwner, Err: generic.ErrLessonsAccessDenied},
	); err != nil {
		return nil, err
	}

	return postgres.DecodeJSONSlice[Lesson](data)
}

func (a *App) CreateRepository(ctx context.Context, tutorID, chapterID string, req CreateLessonRequest) (*Lesson, error) {
	var (
		courseTutorID *string
		courseID      *string
		insertedData  []byte
	)

	err := a.DB.QueryRow(
		ctx,
		CreateLesson,
		chapterID, req.Title, req.LessonType, req.ShortDescription, req.PreviewVideoURL, req.DurationSeconds,
		tutorID,
	).Scan(&courseTutorID, &courseID, &insertedData)
	if err != nil {
		return nil, postgres.MapPgError(err)
	}

	if err := postgres.CheckConditions(
		postgres.Condition{Failed: courseTutorID == nil, Err: generic.ErrLessonsChapterNotFound},
		postgres.Condition{Failed: len(insertedData) == 0 || string(insertedData) == "null", Err: generic.ErrLessonsAccessDenied},
	); err != nil {
		return nil, err
	}

	return postgres.DecodeJSON[Lesson](insertedData)
}

func (a *App) UpdateRepository(ctx context.Context, id, tutorID string, req UpdateLessonRequest) (*Lesson, *LessonFileCleanup, error) {
	var (
		lessonExists       bool
		isOwner            bool
		oldPreviewVideoURL *string
		updatedData        []byte
	)

	err := a.DB.QueryRow(
		ctx,
		UpdateLesson,
		id, tutorID, req.Title, req.ShortDescription, req.PreviewVideoURL, req.DurationSeconds,
	).Scan(&lessonExists, &isOwner, &oldPreviewVideoURL, &updatedData)
	if err != nil {
		return nil, nil, postgres.MapPgError(err)
	}

	if err := postgres.CheckConditions(
		postgres.Condition{Failed: !lessonExists, Err: generic.ErrLessonsLessonNotFound},
		postgres.Condition{Failed: !isOwner, Err: generic.ErrLessonsAccessDenied},
	); err != nil {
		return nil, nil, err
	}

	lesson, err := postgres.DecodeJSON[Lesson](updatedData)
	if err != nil {
		return nil, nil, err
	}

	cleanup := &LessonFileCleanup{
		OldPreviewVideoURL: oldPreviewVideoURL,
	}

	return lesson, cleanup, nil
}

func (a *App) DeleteRepository(ctx context.Context, id, tutorID string) (string, *LessonDeleteCleanup, error) {
	var (
		lessonExists       bool
		isOwner            bool
		deletedID          *string
		oldPreviewVideoURL *string
		videoURL           *string
		resourceURLs       []string
	)

	err := a.DB.QueryRow(ctx, DeleteLesson, id, tutorID).Scan(
		&lessonExists, &isOwner, &deletedID, &oldPreviewVideoURL, &videoURL, &resourceURLs,
	)
	if err != nil {
		return "", nil, postgres.MapPgError(err)
	}

	if err := postgres.CheckConditions(
		postgres.Condition{Failed: !lessonExists, Err: generic.ErrLessonsLessonNotFound},
		postgres.Condition{Failed: !isOwner, Err: generic.ErrLessonsAccessDenied},
	); err != nil {
		return "", nil, err
	}

	cleanup := &LessonDeleteCleanup{
		OldPreviewVideoURL: oldPreviewVideoURL,
		VideoURL:           videoURL,
		ResourceURLs:       resourceURLs,
	}

	return *deletedID, cleanup, nil
}
