package wishlist

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"coursehunt/server/internals/utils"
)

type wishlistListCacheData struct {
	Data  []WishlistItem `json:"data"`
	Total int            `json:"total"`
}

func (a *App) List(ctx context.Context, userID string, page, limit int) ([]WishlistItem, int, error) {
	cacheKey := fmt.Sprintf("wishlist:user:%s:p:%d:l:%d", userID, page, limit)

	var cached wishlistListCacheData
	if hit, _ := a.Cache.Get(ctx, cacheKey, &cached); hit {
		return cached.Data, cached.Total, nil
	}

	list, total, err := a.ListRepository(ctx, userID, page, limit)
	if err != nil {
		return nil, 0, utils.ErrInternal("Failed to fetch wishlist.", err)
	}

	_ = a.Cache.Set(ctx, cacheKey, wishlistListCacheData{Data: list, Total: total}, 5*time.Minute)

	return list, total, nil
}

func (a *App) Create(ctx context.Context, userID, courseID string) (*WishlistItem, error) {
	item, err := a.CreateRepository(ctx, userID, courseID)
	if err != nil {
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
		if errors.Is(err, sql.ErrNoRows) {
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
