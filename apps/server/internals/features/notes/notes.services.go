package notes

import (
	"context"
	"errors"
	"fmt"
	"time"

	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/pkg/cache"
	"coursehunt/server/internals/pkg/postgres"
	"coursehunt/server/internals/utils"
)

func (a *App) Upsert(ctx context.Context, userID, lessonID, content string) (*NoteResponse, error) {
	content = utils.SanitizeUGC(content)
	if content == "" {
		return nil, utils.ErrBadRequest("Note content cannot be empty after sanitization.", nil)
	}

	n, err := a.UpsertRepository(ctx, userID, lessonID, content)
	if err != nil {
		switch {
		case errors.Is(err, generic.ErrNotesLessonNotFound):
			return nil, utils.ErrNotFound("Lesson not found.", err)
		case errors.Is(err, generic.ErrNotesNotEnrolled):
			return nil, utils.ErrForbidden("Access denied. Not enrolled in course.", err)
		default:
			return nil, utils.ErrInternal("Failed to save note.", err)
		}
	}

	a.Cache.Invalidate(ctx, fmt.Sprintf("notes:read:u:%s:l:%s", userID, lessonID))
	a.Cache.Invalidate(ctx, fmt.Sprintf("notes:read:u:%s:*", userID))

	return n, nil
}

func (a *App) Read(ctx context.Context, userID, lessonID string) (*NoteResponse, error) {
	cacheKey := fmt.Sprintf("notes:read:u:%s:l:%s", userID, lessonID)

	res, err := cache.FetchOrNegative(ctx, a.Cache, cacheKey, 10*time.Minute, func(e error) bool {
		return errors.Is(e, generic.ErrNoteNotFound)
	}, func() (*NoteResponse, error) {
		n, err := a.ReadRepository(ctx, userID, lessonID)
		if err != nil {
			return nil, err
		}

		return &NoteResponse{
			ID:        n.ID,
			Content:   n.Content,
			UpdatedAt: n.UpdatedAt,
		}, nil
	})
	if err != nil {
		switch {
		case errors.Is(err, generic.ErrNotesLessonNotFound):
			return nil, utils.ErrNotFound("Lesson not found.", err)
		case errors.Is(err, generic.ErrNotesNotEnrolled):
			return nil, utils.ErrForbidden("Access denied. Not enrolled in course.", err)
		case errors.Is(err, generic.ErrNoteNotFound), errors.Is(err, postgres.ErrNotFound):
			return nil, utils.ErrNotFound("Note not found.", err)
		default:
			return nil, utils.ErrInternal("Failed to fetch note.", err)
		}
	}

	return res, nil
}

func (a *App) Update(ctx context.Context, id, userID, content string) (*NoteResponse, error) {
	n, err := a.UpdateRepository(ctx, id, userID, content)
	if err != nil {
		switch {
		case errors.Is(err, generic.ErrNoteNotFound):
			return nil, utils.ErrNotFound("Note not found.", err)
		case errors.Is(err, generic.ErrNotesAccessDenied):
			return nil, utils.ErrForbidden("Access denied. You do not own this note.", err)
		case errors.Is(err, generic.ErrNotesNotEnrolled):
			return nil, utils.ErrForbidden("Access denied. Not enrolled in course.", err)
		default:
			return nil, utils.ErrInternal("Failed to update note.", err)
		}
	}

	a.Cache.Invalidate(ctx, fmt.Sprintf("notes:read:u:%s:*", userID))

	return n, nil
}

func (a *App) Delete(ctx context.Context, id, userID string) (string, error) {
	deletedID, err := a.DeleteRepository(ctx, id, userID)
	if err != nil {
		switch {
		case errors.Is(err, generic.ErrNoteNotFound):
			return "", utils.ErrNotFound("Note not found.", err)
		case errors.Is(err, generic.ErrNotesAccessDenied):
			return "", utils.ErrForbidden("Access denied. You do not own this note.", err)
		case errors.Is(err, generic.ErrNotesNotEnrolled):
			return "", utils.ErrForbidden("Access denied. Not enrolled in course.", err)
		default:
			return "", utils.ErrInternal("Failed to delete note.", err)
		}
	}

	a.Cache.Invalidate(ctx, fmt.Sprintf("notes:read:u:%s:*", userID))

	return deletedID, nil
}
