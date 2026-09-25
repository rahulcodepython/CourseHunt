package security

import (
	"context"
	"log/slog"
	"time"
)

// PruneExpiredSessions safely purges expired records from the sessions table
// to prevent table bloat and disk write amplification over time.
func (a *App) PruneExpiredSessions(ctx context.Context) (int64, error) {
	tag, err := a.DB.Exec(ctx, `DELETE FROM "sessions" WHERE "expiresAt" < CURRENT_TIMESTAMP`)
	if err != nil {
		slog.Error("security: failed to prune expired sessions", "error", err)
		return 0, err
	}
	deleted := tag.RowsAffected()
	if deleted > 0 {
		slog.Info("security: pruned expired sessions", "count", deleted)
	}
	return deleted, nil
}

// StartBackgroundWorkers runs background maintenance tasks for security,
// including hourly pruning of expired session tokens.
func (a *App) StartBackgroundWorkers(ctx context.Context) {
	go a.startSessionPrunerCron(ctx)
}

func (a *App) startSessionPrunerCron(ctx context.Context) {
	// Run initial prune on startup with delay
	time.AfterFunc(10*time.Second, func() {
		pruneCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()
		_, _ = a.PruneExpiredSessions(pruneCtx)
	})

	ticker := time.NewTicker(1 * time.Hour)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			pruneCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
			_, _ = a.PruneExpiredSessions(pruneCtx)
			cancel()
		}
	}
}
