package wishlist

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

type wishlistListCacheData struct {
	Data  []WishlistItem `json:"data"`
	Total int            `json:"total"`
}

func (a *App) List(ctx context.Context, userID string, page, limit int) ([]WishlistItem, int, error) {
	cacheKey := fmt.Sprintf("wishlist:user:%s:p:%d:l:%d", userID, page, limit)

	result, err := cache.Fetch(ctx, a.Cache, cacheKey, 5*time.Minute, func() (wishlistListCacheData, error) {
		list, total, err := a.ListRepository(ctx, userID, page, limit)
		if err != nil {
			return wishlistListCacheData{}, utils.ErrInternal("Failed to fetch wishlist.", err)
		}
		return wishlistListCacheData{Data: list, Total: total}, nil
	})
	if err != nil {
		return nil, 0, err
	}
	return result.Data, result.Total, nil
}

func (a *App) Create(ctx context.Context, userID, courseID string) (*WishlistItem, error) {
	item, err := a.CreateRepository(ctx, userID, courseID)
	if err != nil {
		if errors.Is(err, generic.ErrWishlistLimitReached) {
			return nil, utils.ErrBadRequest("Wishlist limit reached (max 100 items).", err)
		}
		return nil, utils.ErrInternal("Failed to add to wishlist.", err)
	}

	a.Cache.InvalidateWishlist(ctx, userID)

	return item, nil
}

func (a *App) Delete(ctx context.Context, userID, id string) (string, error) {
	deletedID, err := a.DeleteRepository(ctx, userID, id)
	if err != nil {
		// The delete is scoped to the caller's own user_id, so "no rows"
		// covers both "doesn't exist" and "belongs to someone else" — either
		// way it's a 404, not a 500 leaking the raw driver error.
		// DeleteRepository maps the driver's no-rows case through
		// postgres.MapPgError, which produces postgres.ErrNotFound — not the
		// stdlib database/sql.ErrNoRows this used to check for, which this
		// pgx-based repository layer never actually returns.
		if errors.Is(err, postgres.ErrNotFound) {
			return "", utils.ErrNotFound("Wishlist item not found.", err)
		}
		return "", utils.ErrInternal("Failed to remove from wishlist.", err)
	}

	a.Cache.InvalidateWishlist(ctx, userID)

	return deletedID, nil
}

func (a *App) Clear(ctx context.Context, userID string) error {
	if err := a.ClearRepository(ctx, userID); err != nil {
		return utils.ErrInternal("Failed to clear wishlist.", err)
	}

	a.Cache.InvalidateWishlist(ctx, userID)

	return nil
}
