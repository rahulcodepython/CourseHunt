package notes

import (
	"context"
	"errors"
	"fmt"
	"time"

	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/utils"
)

func (a *App) Upsert(ctx context.Context, userID, lessonID, content string) (*NoteResponse, error) {
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

	a.Cache.InvalidateNotes(ctx)

	return n, nil
}

// Read's two return paths deliberately carry different JSON shapes, exactly
// as the pre-refactor handler did: a cache hit only ever had a NoteResponse
// (id/content/updated_at) on hand, while a cache miss returns the full
// UserNote (adds user_id/lesson_id/course_id) fetched from the DB — the
// cache is filled with the wider value, but only the narrower one is ever
// read back out. Preserved as-is rather than "fixed" here, since normalizing
// it is a behavior change outside the scope of this reorganization.
func (a *App) Read(ctx context.Context, userID, lessonID string) (any, error) {
	cacheKey := fmt.Sprintf("notes:read:u:%s:l:%s", userID, lessonID)

	var cached NoteResponse
	if hit, _ := a.Cache.Get(ctx, cacheKey, &cached); hit {
		return cached, nil
	}

	n, err := a.ReadRepository(ctx, userID, lessonID)
	if err != nil {
		switch {
		case errors.Is(err, generic.ErrNotesLessonNotFound):
			return nil, utils.ErrNotFound("Lesson not found.", err)
		case errors.Is(err, generic.ErrNotesNotEnrolled):
			return nil, utils.ErrForbidden("Access denied. Not enrolled in course.", err)
		case errors.Is(err, generic.ErrNoteNotFound):
			return nil, utils.ErrNotFound("Note not found.", err)
		default:
			return nil, utils.ErrInternal("Failed to fetch note.", err)
		}
	}

	_ = a.Cache.Set(ctx, cacheKey, n, 10*time.Minute)

	return n, nil
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

	a.Cache.InvalidateNotes(ctx)

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

	a.Cache.InvalidateNotes(ctx)

	return deletedID, nil
}
