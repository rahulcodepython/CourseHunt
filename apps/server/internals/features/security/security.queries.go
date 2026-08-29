package security

import "fmt"

const (
	Stats = `
		SELECT row_to_json(s.*)
		FROM (
			SELECT
				(SELECT COUNT(*) FROM security_events WHERE event_type = 'login' AND created_at >= date_trunc('day', NOW())) AS logins_today,
				(SELECT COUNT(*) FROM security_events WHERE event_type = 'unauthorized_access' AND created_at >= NOW() - INTERVAL '24 hours') AS unauthorized_last_24h,
				(SELECT COUNT(*) FROM security_events WHERE event_type = 'rate_limit_exceeded' AND created_at >= NOW() - INTERVAL '24 hours') AS rate_limit_hits_last_24h,
				(SELECT COUNT(*) FROM "users" WHERE banned = true) AS banned_users
		) s;
	`
)

func BuildListEventsQuery(whereClause string, limitParam int) string {
	return fmt.Sprintf(`
		SELECT COALESCE(
			jsonb_agg(
				jsonb_build_object(
					'id', id, 'event_type', event_type, 'user_id', user_id,
					'email', email, 'ip_address', ip_address, 'user_agent', user_agent,
					'path', path, 'created_at', created_at
				) ORDER BY id DESC
			), '[]'::jsonb
		)
		FROM (
			SELECT id, event_type, user_id, email, ip_address, user_agent, path, created_at
			FROM security_events
			%s
			ORDER BY id DESC
			LIMIT $%d
		) se;
	`, whereClause, limitParam)
}
