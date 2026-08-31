package logs

import (
	"context"

	"coursehunt/server/internals/utils"
)

func (a *App) List(ctx context.Context, afterID, beforeID *int64, limit int) ([]LogEntry, error) {
	list, err := a.ListRepository(ctx, afterID, beforeID, limit)
	if err != nil {
		return nil, utils.ErrInternal("Failed to fetch logs.", err)
	}
	return list, nil
}
