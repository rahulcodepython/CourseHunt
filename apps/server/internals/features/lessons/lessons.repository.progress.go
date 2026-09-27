package lessons

import (
	"context"

	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/pkg/postgres"
)

func (a *App) UpdateCompleteRepository(ctx context.Context, lessonID, userID string) error {
	var (
		lessonExists bool
		isEnrolled   bool
		completed    bool
	)

	err := a.DB.QueryRow(ctx, UpdateComplete, lessonID, userID).Scan(
		&lessonExists, &isEnrolled, &completed,
	)
	if err != nil {
		return postgres.MapPgError(err)
	}

	if !lessonExists {
		return generic.ErrLessonsLessonNotFound
	}
	if !isEnrolled {
		return generic.ErrLessonsNotEnrolled
	}
	return nil
}
