package repositories

import (
	"fmt"

	"coursehunt/server/internals/entities"

	"github.com/jmoiron/sqlx"
)

type SecurityRepository struct {
	DB *sqlx.DB
}

func NewSecurityRepository(db *sqlx.DB) *SecurityRepository {
	return &SecurityRepository{DB: db}
}

// ListEventsRepository — same cursor shape as LogsRepository/
// NotificationsRepository, plus an optional event_type filter for the
// three security sub-views (logins / unauthorized attempts / rate-limit hits).
func (r *SecurityRepository) ListEventsRepository(eventType string, afterID, beforeID *int64, limit int) ([]entities.SecurityEvent, error) {
	var args []any
	var where []string

	if eventType != "" {
		args = append(args, eventType)
		where = append(where, fmt.Sprintf("event_type = $%d", len(args)))
	}
	switch {
	case beforeID != nil:
		args = append(args, *beforeID)
		where = append(where, fmt.Sprintf("id < $%d", len(args)))
	case afterID != nil:
		args = append(args, *afterID)
		where = append(where, fmt.Sprintf("id > $%d", len(args)))
	}

	whereClause := ""
	if len(where) > 0 {
		whereClause = "WHERE " + where[0]
		for _, w := range where[1:] {
			whereClause += " AND " + w
		}
	}

	args = append(args, limit)
	limitParam := len(args)

	query := fmt.Sprintf(`
		SELECT id, event_type, user_id, email, ip_address, user_agent, path, created_at
		FROM security_events
		%s
		ORDER BY id DESC
		LIMIT $%d
	`, whereClause, limitParam)

	var list []entities.SecurityEvent
	if err := r.DB.Select(&list, query, args...); err != nil {
		return nil, err
	}
	return list, nil
}

func (r *SecurityRepository) StatsRepository() (*entities.SecurityStats, error) {
	var stats entities.SecurityStats
	err := r.DB.Get(&stats, `
		SELECT
			(SELECT COUNT(*) FROM security_events WHERE event_type = 'login' AND created_at >= date_trunc('day', NOW())) AS logins_today,
			(SELECT COUNT(*) FROM security_events WHERE event_type = 'unauthorized_access' AND created_at >= NOW() - INTERVAL '24 hours') AS unauthorized_last_24h,
			(SELECT COUNT(*) FROM security_events WHERE event_type = 'rate_limit_exceeded' AND created_at >= NOW() - INTERVAL '24 hours') AS rate_limit_hits_last_24h,
			(SELECT COUNT(*) FROM "users" WHERE banned = true) AS banned_users
	`)
	if err != nil {
		return nil, err
	}
	return &stats, nil
}
