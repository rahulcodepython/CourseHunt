package categories

import (
	"context"
	"fmt"
	"time"

	"coursehunt/server/internals/utils"
)

type categoryListCacheData struct {
	Cats  []Category `json:"cats"`
	Total int        `json:"total"`
}

func (a *App) List(ctx context.Context, page, limit int, name string) ([]Category, int, error) {
	cacheKey := fmt.Sprintf("categories:list:page:%d:limit:%d:name:%s", page, limit, name)

	var cached categoryListCacheData
	if hit, _ := a.Cache.Get(ctx, cacheKey, &cached); hit {
		return cached.Cats, cached.Total, nil
	}

	cats, total, err := a.ListRepository(ctx, page, limit, name)
	if err != nil {
		return nil, 0, utils.ErrInternal("Failed to fetch categories.", err)
	}

	_ = a.Cache.Set(ctx, cacheKey, categoryListCacheData{Cats: cats, Total: total}, 10*time.Minute)

	return cats, total, nil
}

func (a *App) Create(ctx context.Context, req CreateCategoryRequest) (*Category, error) {
	cat, err := a.CreateRepository(ctx, req.Name, req.ParentID)
	if err != nil {
		return nil, utils.ErrInternal("Failed to create category.", err)
	}

	a.Cache.InvalidateCategories(ctx)

	return cat, nil
}

func (a *App) Update(ctx context.Context, id string, req UpdateCategoryRequest) (*Category, error) {
	cat, err := a.UpdateRepository(ctx, id, req.Name)
	if err != nil {
		return nil, utils.ErrInternal("Failed to update category.", err)
	}

	a.Cache.InvalidateCategories(ctx)

	return cat, nil
}

func (a *App) Delete(ctx context.Context, id string) (string, error) {
	deletedID, err := a.DeleteRepository(ctx, id)
	if err != nil {
		return "", utils.ErrInternal("Failed to delete category.", err)
	}

	a.Cache.InvalidateCategories(ctx)

	return deletedID, nil
}
