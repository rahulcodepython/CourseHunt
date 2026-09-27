package notes

import (
	"context"
	"errors"

	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/pkg/postgres"
)

func (a *App) UpsertRepository(ctx context.Context, userID, lessonID, content string) (*NoteResponse, error) {
	var (
		lessonExists bool
		isEnrolled   bool
		insertedData []byte
	)

	err := a.DB.QueryRow(ctx, UpsertNote, userID, lessonID, content).Scan(
		&lessonExists, &isEnrolled, &insertedData,
	)
	if err != nil {
		return nil, postgres.MapPgError(err)
	}

	if !lessonExists {
		return nil, generic.ErrNotesLessonNotFound
	}
	if !isEnrolled {
		return nil, generic.ErrNotesNotEnrolled
	}
	if len(insertedData) == 0 || string(insertedData) == "null" {
		return nil, errors.New("failed to save note")
	}

	return postgres.DecodeJSON[NoteResponse](insertedData)
}

func (a *App) ReadRepository(ctx context.Context, userID, lessonID string) (*UserNote, error) {
	var (
		lessonExists bool
		isEnrolled   bool
		noteJSON     []byte
	)

	err := a.DB.QueryRow(ctx, ReadNote, userID, lessonID).Scan(
		&lessonExists, &isEnrolled, &noteJSON,
	)
	if err != nil {
		return nil, postgres.MapPgError(err)
	}

	if !lessonExists {
		return nil, generic.ErrNotesLessonNotFound
	}
	if !isEnrolled {
		return nil, generic.ErrNotesNotEnrolled
	}
	if len(noteJSON) == 0 || string(noteJSON) == "null" {
		return nil, generic.ErrNoteNotFound
	}

	return postgres.DecodeJSON[UserNote](noteJSON)
}

func (a *App) UpdateRepository(ctx context.Context, id, userID, content string) (*NoteResponse, error) {
	var (
		noteExists  bool
		isOwner     bool
		isEnrolled  bool
		updatedData []byte
	)

	err := a.DB.QueryRow(ctx, UpdateNote, id, userID, content).Scan(
		&noteExists, &isOwner, &isEnrolled, &updatedData,
	)
	if err != nil {
		return nil, postgres.MapPgError(err)
	}

	if !noteExists {
		return nil, generic.ErrNoteNotFound
	}
	if !isOwner {
		return nil, generic.ErrNotesAccessDenied
	}
	if !isEnrolled {
		return nil, generic.ErrNotesNotEnrolled
	}
	if len(updatedData) == 0 || string(updatedData) == "null" {
		return nil, errors.New("failed to update note")
	}

	return postgres.DecodeJSON[NoteResponse](updatedData)
}

func (a *App) DeleteRepository(ctx context.Context, id, userID string) (string, error) {
	var deletedID string
	err := a.DB.QueryRow(ctx, DeleteNote, id, userID).Scan(&deletedID)
	if err != nil {
		pgErr := postgres.MapPgError(err)
		if errors.Is(pgErr, postgres.ErrNotFound) {
			return "", generic.ErrNoteNotFound
		}
		return "", pgErr
	}
	return deletedID, nil
}
