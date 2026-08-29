package security

import (
	"context"

	"coursehunt/server/internals/utils"
)

func (a *App) ListEvents(ctx context.Context, eventType string, afterID, beforeID *int64, limit int) ([]SecurityEvent, error) {
	list, err := a.ListEventsRepository(ctx, eventType, afterID, beforeID, limit)
	if err != nil {
		return nil, utils.ErrInternal("Failed to fetch security events.", err)
	}
	return list, nil
}

func (a *App) Stats(ctx context.Context) (*SecurityStats, error) {
	stats, err := a.StatsRepository(ctx)
	if err != nil {
		return nil, utils.ErrInternal("Failed to fetch security stats.", err)
	}
	return stats, nil
}
