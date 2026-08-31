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

	if err := postgres.CheckConditions(
		postgres.Condition{Failed: !lessonExists, Err: generic.ErrNotesLessonNotFound},
		postgres.Condition{Failed: !isEnrolled, Err: generic.ErrNotesNotEnrolled},
		postgres.Condition{Failed: len(insertedData) == 0 || string(insertedData) == "null", Err: errors.New("failed to save note")},
	); err != nil {
		return nil, err
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

	if err := postgres.CheckConditions(
		postgres.Condition{Failed: !lessonExists, Err: generic.ErrNotesLessonNotFound},
		postgres.Condition{Failed: !isEnrolled, Err: generic.ErrNotesNotEnrolled},
		postgres.Condition{Failed: len(noteJSON) == 0 || string(noteJSON) == "null", Err: generic.ErrNoteNotFound},
	); err != nil {
		return nil, err
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

	if err := postgres.CheckConditions(
		postgres.Condition{Failed: !noteExists, Err: generic.ErrNoteNotFound},
		postgres.Condition{Failed: !isOwner, Err: generic.ErrNotesAccessDenied},
		postgres.Condition{Failed: !isEnrolled, Err: generic.ErrNotesNotEnrolled},
		postgres.Condition{Failed: len(updatedData) == 0 || string(updatedData) == "null", Err: errors.New("failed to update note")},
	); err != nil {
		return nil, err
	}

	return postgres.DecodeJSON[NoteResponse](updatedData)
}

func (a *App) DeleteRepository(ctx context.Context, id, userID string) (string, error) {
	var (
		noteExists bool
		isOwner    bool
		isEnrolled bool
		deletedID  *string
	)

	err := a.DB.QueryRow(ctx, DeleteNote, id, userID).Scan(
		&noteExists, &isOwner, &isEnrolled, &deletedID,
	)
	if err != nil {
		return "", postgres.MapPgError(err)
	}

	if err := postgres.CheckConditions(
		postgres.Condition{Failed: !noteExists, Err: generic.ErrNoteNotFound},
		postgres.Condition{Failed: !isOwner, Err: generic.ErrNotesAccessDenied},
		postgres.Condition{Failed: !isEnrolled, Err: generic.ErrNotesNotEnrolled},
		postgres.Condition{Failed: deletedID == nil, Err: errors.New("failed to delete note")},
	); err != nil {
		return "", err
	}

	return *deletedID, nil
}
