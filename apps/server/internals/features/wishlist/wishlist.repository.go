package wishlist

import (
	"context"

	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/pkg/postgres"
)

type WishlistPayload struct {
	Total int            `json:"total"`
	Data  []WishlistItem `json:"data"`
}

func (a *App) CreateRepository(ctx context.Context, userID, courseID string) (*WishlistItem, error) {
	var count int
	if err := a.DB.QueryRow(ctx, CountUserWishlist, userID).Scan(&count); err == nil && count >= 100 {
		return nil, generic.ErrWishlistLimitReached
	}

	return postgres.QueryJSON[WishlistItem](ctx, a.DB, CreateWishlist, userID, courseID)
}

func (a *App) DeleteRepository(ctx context.Context, userID, id string) (string, error) {
	var deletedID string
	err := a.DB.QueryRow(ctx, DeleteWishlist, userID, id).Scan(&deletedID)
	if err != nil {
		return "", postgres.MapPgError(err)
	}
	return deletedID, nil
}

func (a *App) ListRepository(ctx context.Context, userID string, page, limit int) ([]WishlistItem, int, error) {
	offset := (page - 1) * limit

	result, err := postgres.QueryJSON[WishlistPayload](ctx, a.DB, ListWishlist, userID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	if result == nil {
		return []WishlistItem{}, 0, nil
	}
	if result.Data == nil {
		result.Data = []WishlistItem{}
	}
	return result.Data, result.Total, nil
}

func (a *App) ClearRepository(ctx context.Context, userID string) error {
	_, err := a.DB.Exec(ctx, ClearWishlist, userID)
	return postgres.MapPgError(err)
}
