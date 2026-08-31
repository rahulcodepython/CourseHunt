package chapters

import (
	"context"
	"errors"
	"fmt"
	"time"

	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/pkg/cache"
	"coursehunt/server/internals/utils"
)

func (a *App) List(ctx context.Context, courseID, userID string, scope generic.AuthScope) ([]Chapter, error) {
	cacheKey := fmt.Sprintf("chapters:list:course:%s:u:%s:s:%v", courseID, userID, scope)

	return cache.Fetch(ctx, a.Cache, cacheKey, 10*time.Minute, func() ([]Chapter, error) {
		chapters, err := a.ListRepository(ctx, courseID, userID, scope)
		if err != nil {
			if errors.Is(err, generic.ErrChaptersCourseNotFound) {
				return nil, utils.ErrNotFound("Course not found.", err)
			}
			if errors.Is(err, generic.ErrChaptersUnauthorized) {
				return nil, utils.ErrForbidden("Access denied. You do not own this course.", err)
			}
			return nil, utils.ErrInternal("Failed to fetch chapters.", err)
		}
		return chapters, nil
	})
}

func (a *App) Create(ctx context.Context, userID, courseID string, req CreateChapterRequest) (*Chapter, error) {
	ch, err := a.CreateRepository(ctx, userID, courseID, req)
	if err != nil {
		if errors.Is(err, generic.ErrChaptersCourseNotFound) {
			return nil, utils.ErrNotFound("Course not found.", err)
		}
		if errors.Is(err, generic.ErrChaptersUnauthorized) {
			return nil, utils.ErrForbidden("Access denied. You do not own this course.", err)
		}
		return nil, utils.ErrInternal("Failed to create chapter.", err)
	}

	a.Cache.Invalidate(ctx, "chapters:*", "courses:*")

	return ch, nil
}

func (a *App) Update(ctx context.Context, id, userID string, req UpdateChapterRequest) (*Chapter, error) {
	ch, err := a.UpdateRepository(ctx, id, userID, req)
	if err != nil {
		if errors.Is(err, generic.ErrChaptersChapterNotFound) {
			return nil, utils.ErrNotFound("Chapter not found.", err)
		}
		if errors.Is(err, generic.ErrChaptersUnauthorized) {
			return nil, utils.ErrForbidden("Access denied. You do not own this course.", err)
		}
		return nil, utils.ErrInternal("Failed to update chapter.", err)
	}

	a.Cache.Invalidate(ctx, "chapters:*", "courses:*")

	return ch, nil
}

func (a *App) Delete(ctx context.Context, id, userID string) (string, error) {
	deletedID, err := a.DeleteRepository(ctx, id, userID)
	if err != nil {
		if errors.Is(err, generic.ErrChaptersChapterNotFound) {
			return "", utils.ErrNotFound("Chapter not found.", err)
		}
		if errors.Is(err, generic.ErrChaptersUnauthorized) {
			return "", utils.ErrForbidden("Access denied. You do not own this course.", err)
		}
		return "", utils.ErrInternal("Failed to delete chapter.", err)
	}

	a.Cache.Invalidate(ctx, "chapters:*", "courses:*")

	return deletedID, nil
}
