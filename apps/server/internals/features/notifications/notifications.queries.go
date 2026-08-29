package notifications

import "fmt"

const DefaultCursorClause = `AND (
	n.id > (SELECT last_seen_notification_id FROM notification_seen WHERE user_id = $1)
	OR (SELECT last_seen_notification_id FROM notification_seen WHERE user_id = $1) IS NULL
)`

func BuildListQuery(roleCol, cursorClause string, limitParam int) string {
	return fmt.Sprintf(`
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
		SELECT COALESCE(
			jsonb_agg(
				jsonb_build_object(
					'id', id, 'type', type, 'message', message, 'created_at', created_at
				) ORDER BY id DESC
			), '[]'::jsonb
		)
		FROM page;
	`, roleCol, cursorClause, limitParam)
}
