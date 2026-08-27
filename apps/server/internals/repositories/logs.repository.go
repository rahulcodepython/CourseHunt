package repositories

import (
	"fmt"

	"coursehunt/server/internals/entities"

	"github.com/jmoiron/sqlx"
)

type LogsRepository struct {
	DB *sqlx.DB
}

func NewLogsRepository(db *sqlx.DB) *LogsRepository {
	return &LogsRepository{DB: db}
}

// ListRepository is the same cursor shape as NotificationsRepository.
// ListRepository — admin-only, so there's no per-user "last seen" cursor to
// resolve; afterID/beforeID are always frontend-supplied (nil on the very
// first page load just means "give me the newest N").
func (r *LogsRepository) ListRepository(afterID, beforeID *int64, limit int) ([]entities.LogEntry, error) {
	var args []any
	var cursorClause string

	switch {
	case beforeID != nil:
		args = append(args, *beforeID)
		cursorClause = fmt.Sprintf("WHERE id < $%d", len(args))
	case afterID != nil:
		args = append(args, *afterID)
		cursorClause = fmt.Sprintf("WHERE id > $%d", len(args))
	}

	args = append(args, limit)
	limitParam := len(args)

	query := fmt.Sprintf(`
		SELECT id, message, actor_email, success, created_at
		FROM logs
		%s
		ORDER BY id DESC
		LIMIT $%d
	`, cursorClause, limitParam)

	var list []entities.LogEntry
	if err := r.DB.Select(&list, query, args...); err != nil {
		return nil, err
	}
	return list, nil
}
