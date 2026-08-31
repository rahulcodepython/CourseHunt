package logs

import (
	"context"

	"coursehunt/server/internals/pkg/postgres"
)

func (a *App) ListRepository(ctx context.Context, afterID, beforeID *int64, limit int) ([]LogEntry, error) {
	filter := postgres.NewFilter()

	switch {
	case beforeID != nil:
		filter.Add("WHERE id < $%d", *beforeID)
	case afterID != nil:
		filter.Add("WHERE id > $%d", *afterID)
	}

	limitParam := filter.NextIdx()
	filter.AddArgs(limit)

	query := BuildListQuery(filter.Join(""), limitParam)
	return postgres.QueryJSONSlice[LogEntry](ctx, a.DB, query, filter.Args...)
}
