package lessons

import (
	"context"

	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/pkg/postgres"
)

func (a *App) MarkLessonCompleteRepository(ctx context.Context, userID, lessonID string) error {
	var (
		lessonExists bool
		isEnrolled   bool
		completed    bool
	)

	err := a.DB.QueryRow(ctx, MarkLessonComplete, lessonID, userID).Scan(
		&lessonExists, &isEnrolled, &completed,
	)
	if err != nil {
		return postgres.MapPgError(err)
	}

	return postgres.CheckConditions(
		postgres.Condition{Failed: !lessonExists, Err: generic.ErrLessonsLessonNotFound},
		postgres.Condition{Failed: !isEnrolled, Err: generic.ErrLessonsNotEnrolled},
	)
}
