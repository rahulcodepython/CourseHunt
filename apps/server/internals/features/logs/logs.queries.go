package logs

import "fmt"

func BuildListQuery(cursorClause string, limitParam int) string {
	return fmt.Sprintf(`
		SELECT COALESCE(
			jsonb_agg(
				jsonb_build_object(
					'id', id, 'message', message, 'actor_email', actor_email, 'success', success, 'created_at', created_at
				) ORDER BY id DESC
			), '[]'::jsonb
		)
		FROM (
			SELECT id, message, actor_email, success, created_at
			FROM logs
			%s
			ORDER BY id DESC
			LIMIT $%d
		) ds;
	`, cursorClause, limitParam)
}
