package lessons

import (
	"context"
	"errors"

	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/pkg/postgres"
)

func (a *App) AdminReadContentRepository(ctx context.Context, lessonID string) (*AggregatedLessonContentResponse, error) {
	var (
		lessonExists bool
		contentData  []byte
	)

	err := a.DB.QueryRow(ctx, ReadContentAdmin, lessonID).Scan(&lessonExists, &contentData)
	if err != nil {
		return nil, postgres.MapPgError(err)
	}

	if !lessonExists {
		return nil, generic.ErrLessonsLessonNotFound
	}
	if len(contentData) == 0 || string(contentData) == "null" {
		return nil, errors.New("failed to retrieve content")
	}

	return postgres.DecodeJSON[AggregatedLessonContentResponse](contentData)
}

func (a *App) StudentReadContentRepository(ctx context.Context, lessonID, userID string) (*AggregatedLessonContentResponse, error) {
	var (
		lessonExists bool
		isEnrolled   bool
		contentData  []byte
	)

	err := a.DB.QueryRow(ctx, ReadContentStudent, lessonID, userID).Scan(&lessonExists, &isEnrolled, &contentData)
	if err != nil {
		return nil, postgres.MapPgError(err)
	}

	if err := postgres.CheckConditions(
		postgres.Condition{Failed: !lessonExists, Err: generic.ErrLessonsLessonNotFound},
		postgres.Condition{Failed: !isEnrolled, Err: generic.ErrLessonsNotEnrolled},
		postgres.Condition{Failed: len(contentData) == 0 || string(contentData) == "null", Err: errors.New("failed to retrieve content")},
	); err != nil {
		return nil, err
	}

	return postgres.DecodeJSON[AggregatedLessonContentResponse](contentData)
}

func (a *App) ReadContentForTutorRepository(ctx context.Context, lessonID, tutorID string) (*AggregatedLessonContentResponse, error) {
	var (
		lessonExists bool
		isOwner      bool
		contentData  []byte
	)

	err := a.DB.QueryRow(ctx, ReadContentForTutor, lessonID, tutorID).Scan(&lessonExists, &isOwner, &contentData)
	if err != nil {
		return nil, postgres.MapPgError(err)
	}

	if err := postgres.CheckConditions(
		postgres.Condition{Failed: !lessonExists, Err: generic.ErrLessonsLessonNotFound},
		postgres.Condition{Failed: !isOwner, Err: generic.ErrLessonsAccessDenied},
		postgres.Condition{Failed: len(contentData) == 0 || string(contentData) == "null", Err: errors.New("failed to retrieve content")},
	); err != nil {
		return nil, err
	}

	return postgres.DecodeJSON[AggregatedLessonContentResponse](contentData)
}

func (a *App) UpsertVideoContentRepository(ctx context.Context, lessonID, tutorID string, req UpsertVideoContentRequest) (*LessonVideoContent, *LessonVideoContentCleanup, error) {
	var (
		lessonExists bool
		isOwner      bool
		oldVideoURL  *string
		contentData  []byte
	)

	err := a.DB.QueryRow(
		ctx,
		UpsertVideoContent,
		lessonID, req.VideoURL, req.WrittenContent, tutorID,
	).Scan(&lessonExists, &isOwner, &oldVideoURL, &contentData)
	if err != nil {
		return nil, nil, postgres.MapPgError(err)
	}

	if err := postgres.CheckConditions(
		postgres.Condition{Failed: !lessonExists, Err: generic.ErrLessonsLessonNotFound},
		postgres.Condition{Failed: !isOwner, Err: generic.ErrLessonsAccessDenied},
	); err != nil {
		return nil, nil, err
	}

	content, err := postgres.DecodeJSON[LessonVideoContent](contentData)
	if err != nil {
		return nil, nil, err
	}

	cleanup := &LessonVideoContentCleanup{
		OldVideoURL: oldVideoURL,
	}

	return content, cleanup, nil
}

func (a *App) UpsertDocumentContentRepository(ctx context.Context, lessonID, tutorID, content string) (*LessonDocumentContent, error) {
	var (
		lessonExists bool
		isOwner      bool
		contentData  []byte
	)

	err := a.DB.QueryRow(
		ctx,
		UpsertDocumentContent,
		lessonID, content, tutorID,
	).Scan(&lessonExists, &isOwner, &contentData)
	if err != nil {
		return nil, postgres.MapPgError(err)
	}

	if err := postgres.CheckConditions(
		postgres.Condition{Failed: !lessonExists, Err: generic.ErrLessonsLessonNotFound},
		postgres.Condition{Failed: !isOwner, Err: generic.ErrLessonsAccessDenied},
	); err != nil {
		return nil, err
	}

	return postgres.DecodeJSON[LessonDocumentContent](contentData)
}
