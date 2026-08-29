package notifications

import (
	"context"

	"coursehunt/server/internals/utils"
)

func (a *App) List(ctx context.Context, userID, role string, afterID, beforeID *int64, limit int) ([]Notification, error) {
	list, err := a.ListRepository(ctx, userID, role, afterID, beforeID, limit)
	if err != nil {
		return nil, utils.ErrInternal("Failed to fetch notifications.", err)
	}
	return list, nil
}
