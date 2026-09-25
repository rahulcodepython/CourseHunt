package postgres

import (
	"context"
	"fmt"
	"log"
	"log/slog"
	"time"

	"coursehunt/server/internals/config"
	"coursehunt/server/internals/pkg/retry"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Connect creates and returns a configured pgx connection pool with retries.
func Connect(cfg *config.Config) *pgxpool.Pool {
	ctx := context.Background()

	poolConfig, err := pgxpool.ParseConfig(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to parse database configuration: %v", err)
	}

	poolConfig.MaxConns = int32(cfg.DBMaxOpenConns)
	if cfg.DBMaxIdleConns > 0 {
		poolConfig.MinConns = int32(cfg.DBMaxIdleConns)
	}
	poolConfig.MaxConnLifetime = time.Duration(cfg.DBConnMaxLifetime) * time.Minute
	poolConfig.MaxConnIdleTime = time.Duration(cfg.DBConnMaxIdleTime) * time.Minute
	poolConfig.HealthCheckPeriod = 1 * time.Minute

	if poolConfig.ConnConfig.RuntimeParams == nil {
		poolConfig.ConnConfig.RuntimeParams = make(map[string]string)
	}
	stmtTimeoutMs := 15000
	if cfg.DBStatementTimeoutSec > 0 {
		stmtTimeoutMs = cfg.DBStatementTimeoutSec * 1000
	}
	poolConfig.ConnConfig.RuntimeParams["statement_timeout"] = fmt.Sprintf("%d", stmtTimeoutMs)

	const maxAttempts = 5
	var pool *pgxpool.Pool
	connectErr := retry.Connect("db", maxAttempts, 2*time.Second, func() error {
		p, err := pgxpool.NewWithConfig(ctx, poolConfig)
		if err != nil {
			return err
		}
		if err := p.Ping(ctx); err != nil {
			p.Close()
			return err
		}
		pool = p
		return nil
	})
	if connectErr != nil {
		log.Fatalf("Failed to connect to database after %d attempts: %v", maxAttempts, connectErr)
	}

	slog.Info("connected to postgres",
		"max_conns", cfg.DBMaxOpenConns, "min_conns", cfg.DBMaxIdleConns,
		"max_lifetime_min", cfg.DBConnMaxLifetime, "max_idle_min", cfg.DBConnMaxIdleTime)

	return pool
}

// Close closes the pgx connection pool cleanly.
func Close(pool *pgxpool.Pool) {
	if pool != nil {
		pool.Close()
		slog.Info("postgres connection pool closed")
	}
}
