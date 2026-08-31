package lessons

import (
	"context"
	"errors"

	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/pkg/postgres"
)

func (a *App) ReadContentRepository(ctx context.Context, lessonID, userID string, scope generic.AuthScope) (*AggregatedLessonContentResponse, error) {
	query := BuildReadContentScopedQuery(scope)

	var (
		lessonExists bool
		isEnrolled   bool
		contentData  []byte
	)

	args := []any{lessonID}
	if scope == generic.ScopeUser {
		args = append(args, userID)
	}

	err := a.DB.QueryRow(ctx, query, args...).Scan(&lessonExists, &isEnrolled, &contentData)
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

func (a *App) UpsertVideoContentRepository(ctx context.Context, lessonID, tutorID string, req UpsertVideoContentRequest) (*LessonVideoContent, *LessonFileCleanup, error) {
	var (
		courseTutorID *string
		oldVideoURL   *string
		insertedData  []byte
	)

	err := a.DB.QueryRow(ctx, UpsertVideoContent, lessonID, req.VideoURL, req.WrittenContent, tutorID).Scan(
		&courseTutorID, &oldVideoURL, &insertedData,
	)
	if err != nil {
		return nil, nil, postgres.MapPgError(err)
	}

	if err := postgres.CheckConditions(
		postgres.Condition{Failed: courseTutorID == nil, Err: generic.ErrLessonsLessonNotFound},
		postgres.Condition{Failed: len(insertedData) == 0 || string(insertedData) == "null", Err: generic.ErrLessonsAccessDenied},
	); err != nil {
		return nil, nil, err
	}

	vc, err := postgres.DecodeJSON[LessonVideoContent](insertedData)
	if err != nil {
		return nil, nil, err
	}
	cleanup := &LessonFileCleanup{OldVideoURL: oldVideoURL}
	return vc, cleanup, nil
}

func (a *App) UpsertDocumentContentRepository(ctx context.Context, lessonID, tutorID, content string) (*LessonDocumentContent, error) {
	var (
		courseTutorID *string
		insertedData  []byte
	)

	err := a.DB.QueryRow(ctx, UpsertDocumentContent, lessonID, content, tutorID).Scan(
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

	return postgres.DecodeJSON[LessonDocumentContent](insertedData)
}
