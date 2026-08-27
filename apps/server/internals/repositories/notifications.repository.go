package repositories

import (
	"fmt"

	"coursehunt/server/internals/entities"
	"coursehunt/server/internals/generic"

	"github.com/jmoiron/sqlx"
)

type NotificationsRepository struct {
	DB *sqlx.DB
}

func NewNotificationsRepository(db *sqlx.DB) *NotificationsRepository {
	return &NotificationsRepository{DB: db}
}

// roleColumnFor maps an account segment to the notifications column that
// gates its feed. Plain "user" accounts (students) don't get a notifications
// feed at all — they have the separate Updates feature — so any role other
// than admin/tutor short-circuits to an empty result in ListRepository.
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

// ListRepository powers the notifications feed. Cursor-based rather than
// offset-based, because new rows keep arriving between requests (offset
// pagination drifts under concurrent inserts): afterID means "what's new
// since this id" (initial load, poll, manual refresh — the frontend passes
// its current highest-seen id; omitted only on a user's very first-ever
// call, in which case the cursor is resolved from notification_seen),
// beforeID means "give me older ones before this id" (Load More).
//
// Every successful fetch also advances notification_seen to the newest id
// just returned, fused into the same query as one more chained CTE — no
// extra round trip for the "update last seen on every fetch" requirement.
func (r *NotificationsRepository) ListRepository(userID, role string, afterID, beforeID *int64, limit int) ([]entities.Notification, error) {
	roleCol, ok := roleColumnFor(role)
	if !ok {
		return []entities.Notification{}, nil
	}

	args := []any{userID}
	var cursorClause string

	switch {
	case beforeID != nil:
		args = append(args, *beforeID)
		cursorClause = fmt.Sprintf("AND n.id < $%d", len(args))
	case afterID != nil:
		args = append(args, *afterID)
		cursorClause = fmt.Sprintf("AND n.id > $%d", len(args))
	default:
		// First-ever call for this user (or their notification_seen row was
		// never created): fall back to whatever's stored server-side, and to
		// "just the newest N" if there's no stored cursor either.
		cursorClause = `AND (
			n.id > (SELECT last_seen_notification_id FROM notification_seen WHERE user_id = $1)
			OR (SELECT last_seen_notification_id FROM notification_seen WHERE user_id = $1) IS NULL
		)`
	}

	args = append(args, limit)
	limitParam := len(args)

	query := fmt.Sprintf(`
		WITH page AS (
			SELECT n.id, n.type, n.message, n.created_at
			FROM notifications n
			WHERE n.%s = true %s
			ORDER BY n.id DESC
			LIMIT $%d
		),
		seen_upsert AS (
			INSERT INTO notification_seen (user_id, last_seen_notification_id, updated_at)
			SELECT $1::uuid, mx, CURRENT_TIMESTAMP
			FROM (SELECT MAX(id) AS mx FROM page) s
			WHERE s.mx IS NOT NULL
			ON CONFLICT (user_id) DO UPDATE
				SET last_seen_notification_id = GREATEST(notification_seen.last_seen_notification_id, EXCLUDED.last_seen_notification_id),
				    updated_at = CURRENT_TIMESTAMP
		)
		SELECT id, type, message, created_at FROM page ORDER BY id DESC
	`, roleCol, cursorClause, limitParam)

	var list []entities.Notification
	if err := r.DB.Select(&list, query, args...); err != nil {
		return nil, err
	}
	return list, nil
}
