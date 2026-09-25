package notifications

import (
	"context"

	"coursehunt/server/internals/pkg/postgres"
)

func (a *App) ListRepository(ctx context.Context, userID, role string, afterID, beforeID *int64, limit int) ([]Notification, error) {
	roleCol, ok := roleColumnFor(role)
	if !ok {
		return []Notification{}, nil
	}

	filter := postgres.NewFilter(userID)

	switch {
	case beforeID != nil:
		filter.AddCondition("AND n.id < $%d", *beforeID)
	case afterID != nil:
		filter.AddCondition("AND n.id > $%d", *afterID)
	default:
		filter.AddRawCondition(DefaultCursorClause)
	}

	limitParam := filter.NextIndex()
	filter.AddArgs(limit)

	query := BuildListQuery(roleCol, filter.Join(""), limitParam)
	return postgres.QueryJSONSlice[Notification](ctx, a.DB, query, filter.Args...)
}
