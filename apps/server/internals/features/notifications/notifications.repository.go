package notifications

import (
	"context"

	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/pkg/postgres"
)

func roleColumnFor(role string) (string, bool) {
	switch role {
	case generic.RoleAdmin:
		return "is_admin", true
	case generic.RoleTutor:
		return "is_tutor", true
	default:
		return "", false
	}
}

func (a *App) ListRepository(ctx context.Context, userID, role string, afterID, beforeID *int64, limit int) ([]Notification, error) {
	roleCol, ok := roleColumnFor(role)
	if !ok {
		return []Notification{}, nil
	}

	filter := postgres.NewFilter(userID)

	switch {
	case beforeID != nil:
		filter.Add("AND n.id < $%d", *beforeID)
	case afterID != nil:
		filter.Add("AND n.id > $%d", *afterID)
	default:
		filter.AddRaw(DefaultCursorClause)
	}

	limitParam := filter.NextIdx()
	filter.AddArgs(limit)

	query := BuildListQuery(roleCol, filter.Join(""), limitParam)
	return postgres.QueryJSONSlice[Notification](ctx, a.DB, query, filter.Args...)
}
