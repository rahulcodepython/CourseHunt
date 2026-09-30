package chapters

import (
	"context"

	"coursehunt/server/internals/pkg/postgres"
)

func (a *App) AdminListRepository(ctx context.Context, courseID string) ([]Chapter, error) {
	return postgres.QueryJSONSlice[Chapter](ctx, a.DB, ListAdmin, courseID)
}

func (a *App) AdminGetByIDRepository(ctx context.Context, id string) (*Chapter, error) {
	return postgres.QueryJSON[Chapter](ctx, a.DB, GetByIDAdmin, id)
}

func (a *App) TutorListRepository(ctx context.Context, courseID, userID string) ([]Chapter, error) {
	return postgres.QuerySliceWithStatus[Chapter](ctx, a.DB, ListScoped, chapterCourseErrMap, courseID, userID)
}

func (a *App) TutorGetByIDRepository(ctx context.Context, id, userID string) (*Chapter, error) {
	return postgres.QueryWithStatus[Chapter](ctx, a.DB, GetByIDTutor, chapterItemErrMap, id, userID)
}

func (a *App) CreateRepository(ctx context.Context, userID, courseID string, req CreateChapterRequest) (*Chapter, error) {
	return postgres.QueryWithStatus[Chapter](ctx, a.DB, CreateChapter, chapterCourseErrMap, courseID, userID, req.Title, req.UnlockDaysAfterEnrollment, req.UnlockAt, req.PrerequisiteChapterID)
}

func (a *App) UpdateRepository(ctx context.Context, id, userID string, req UpdateChapterRequest) (*Chapter, error) {
	return postgres.QueryWithStatus[Chapter](ctx, a.DB, UpdateChapter, chapterItemErrMap, id, userID, req.Title, req.UnlockDaysAfterEnrollment, req.UnlockAt, req.PrerequisiteChapterID)
}

func (a *App) DeleteRepository(ctx context.Context, id, userID string) (string, error) {
	return postgres.QueryIDWithStatus(ctx, a.DB, DeleteChapter, chapterItemErrMap, id, userID)
}
