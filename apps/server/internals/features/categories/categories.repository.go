package categories

import (
	"context"

	"coursehunt/server/internals/pkg/postgres"
)

type CategoriesListPayload struct {
	Total int        `json:"total"`
	Data  []Category `json:"data"`
}

// ListRepository returns paginated root categories with their subcategories.
func (a *App) ListRepository(ctx context.Context, page, limit int, name string) ([]Category, int, error) {
	offset := (page - 1) * limit

	result, err := postgres.QueryJSON[CategoriesListPayload](
		ctx,
		a.DB,
		ListCategoriesJSON,
		limit,
		offset,
		name,
	)
	if err != nil {
		return nil, 0, err
	}
	if result == nil {
		return []Category{}, 0, nil
	}
	if result.Data == nil {
		result.Data = []Category{}
	}
	return result.Data, result.Total, nil
}

func (a *App) CreateRepository(ctx context.Context, name string, parentID *string) (*Category, error) {
	return postgres.QueryJSON[Category](ctx, a.DB, CreateCategoryJSON, name, parentID)
}

func (a *App) UpdateRepository(ctx context.Context, id, name string) (*Category, error) {
	return postgres.QueryJSON[Category](ctx, a.DB, UpdateCategoryJSON, name, id)
}

func (a *App) DeleteRepository(ctx context.Context, id string) (string, error) {
	var deletedID string
	err := a.DB.QueryRow(ctx, DeleteCategory, id).Scan(&deletedID)
	if err != nil {
		return "", postgres.MapPgError(err)
	}
	return deletedID, nil
}
