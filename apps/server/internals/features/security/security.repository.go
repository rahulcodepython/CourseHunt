package security

import (
	"context"

	"coursehunt/server/internals/pkg/postgres"
)

func (a *App) ListEventsRepository(ctx context.Context, eventType string, afterID, beforeID *int64, limit int) ([]SecurityEvent, error) {
	filter := postgres.NewFilter()

	if eventType != "" {
		filter.Add("event_type = $%d", eventType)
	}
	switch {
	case beforeID != nil:
		filter.Add("id < $%d", *beforeID)
	case afterID != nil:
		filter.Add("id > $%d", *afterID)
	}

	limitParam := filter.NextIdx()
	filter.AddArgs(limit)

	query := BuildListEventsQuery(filter.Where(""), limitParam)
	return postgres.QueryJSONSlice[SecurityEvent](ctx, a.DB, query, filter.Args...)
}

func (a *App) StatsRepository(ctx context.Context) (*SecurityStats, error) {
	return postgres.QueryJSON[SecurityStats](ctx, a.DB, Stats)
}
