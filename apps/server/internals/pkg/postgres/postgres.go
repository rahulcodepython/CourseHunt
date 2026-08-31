package postgres

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"log/slog"
	"time"

	"coursehunt/server/internals/config"
	"coursehunt/server/internals/pkg/retry"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Standard Domain Errors for HTTP Handlers / Controllers
var (
	ErrNotFound     = errors.New("requested resource not found")
	ErrForbidden    = errors.New("access denied for entity")
	ErrInvalidState = errors.New("invalid state machine transition")
	ErrConflict     = errors.New("resource conflict or constraint violation")
	ErrInternalDB   = errors.New("unexpected database error")
)

// Connect creates and returns a configured pgx connection pool.
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

// MapPgError maps PostgreSQL SQLSTATE error codes to standardized domain errors.
func MapPgError(err error) error {
	if err == nil {
		return nil
	}

	if errors.Is(err, pgx.ErrNoRows) {
		return ErrNotFound
	}

	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		switch pgErr.Code {
		case "02000": // NO DATA FOUND
			return fmt.Errorf("%w: %s", ErrNotFound, pgErr.Message)
		case "42501": // INSUFFICIENT PRIVILEGE / FORBIDDEN
			return fmt.Errorf("%w: %s", ErrForbidden, pgErr.Message)
		case "23505": // UNIQUE VIOLATION / CONFLICT
			return fmt.Errorf("%w: %s", ErrConflict, pgErr.Message)
		case "P0001", "P0002": // CUSTOM DOMAIN EXCEPTION / UNPROCESSABLE
			return fmt.Errorf("%w: %s", ErrInvalidState, pgErr.Message)
		default:
			return fmt.Errorf("%w [SQLSTATE %s]: %s", ErrInternalDB, pgErr.Code, pgErr.Message)
		}
	}

	return err
}

// QueryJSON executes a query that returns a single JSONB document
// and deserializes it directly into the domain type T.
func QueryJSON[T any](
	ctx context.Context,
	pool *pgxpool.Pool,
	sqlQuery string,
	args ...any,
) (*T, error) {
	var rawJSON []byte

	err := pool.QueryRow(ctx, sqlQuery, args...).Scan(&rawJSON)
	if err != nil {
		return nil, MapPgError(err)
	}

	return DecodeJSON[T](rawJSON)
}

// QueryJSONSlice executes a query that returns a JSONB array document
// and deserializes it directly into a slice of domain type T ([]T).
func QueryJSONSlice[T any](
	ctx context.Context,
	pool *pgxpool.Pool,
	sqlQuery string,
	args ...any,
) ([]T, error) {
	var rawJSON []byte

	err := pool.QueryRow(ctx, sqlQuery, args...).Scan(&rawJSON)
	if err != nil {
		return nil, MapPgError(err)
	}

	return DecodeJSONSlice[T](rawJSON)
}

// Exec executes a standard SQL statement (INSERT, UPDATE, DELETE) and maps errors.
func Exec(
	ctx context.Context,
	pool *pgxpool.Pool,
	sqlQuery string,
	args ...any,
) error {
	_, err := pool.Exec(ctx, sqlQuery, args...)
	return MapPgError(err)
}

// ExecuteDBFunction is an alias for QueryJSON for backward compatibility.
func ExecuteDBFunction[T any](
	ctx context.Context,
	pool *pgxpool.Pool,
	sqlQuery string,
	args ...any,
) (*T, error) {
	return QueryJSON[T](ctx, pool, sqlQuery, args...)
}

// WithTx runs fn inside a database transaction managed by pgxpool.
func WithTx(ctx context.Context, pool *pgxpool.Pool, fn func(tx pgx.Tx) error) error {
	tx, err := pool.Begin(ctx)
	if err != nil {
		return MapPgError(err)
	}
	defer tx.Rollback(ctx) //nolint:errcheck // Rollback after Commit is a no-op

	if err := fn(tx); err != nil {
		return MapPgError(err)
	}

	if err := tx.Commit(ctx); err != nil {
		return MapPgError(err)
	}
	return nil
}

// StatusErrorMap maps non-success status codes (e.g., 0, 1, 3) to domain errors.
type StatusErrorMap map[int]error

// QueryWithStatus executes a query returning (status_code int, json_data jsonb),
// checks against the provided StatusErrorMap, and deserializes json_data into *T.
func QueryWithStatus[T any](
	ctx context.Context,
	pool *pgxpool.Pool,
	sqlQuery string,
	errMap StatusErrorMap,
	args ...any,
) (*T, error) {
	var statusFlag int
	var dataJSON []byte

	err := pool.QueryRow(ctx, sqlQuery, args...).Scan(&statusFlag, &dataJSON)
	if err != nil {
		return nil, MapPgError(err)
	}

	if mappedErr, ok := errMap[statusFlag]; ok {
		return nil, mappedErr
	}

	return DecodeJSON[T](dataJSON)
}

// QuerySliceWithStatus executes a query returning (status_code int, json_data jsonb),
// checks against the provided StatusErrorMap, and deserializes json_data into []T.
// If data is empty or null, it returns an empty slice []T{}.
func QuerySliceWithStatus[T any](
	ctx context.Context,
	pool *pgxpool.Pool,
	sqlQuery string,
	errMap StatusErrorMap,
	args ...any,
) ([]T, error) {
	var statusFlag int
	var dataJSON []byte

	err := pool.QueryRow(ctx, sqlQuery, args...).Scan(&statusFlag, &dataJSON)
	if err != nil {
		return nil, MapPgError(err)
	}

	if mappedErr, ok := errMap[statusFlag]; ok {
		return nil, mappedErr
	}

	return DecodeJSONSlice[T](dataJSON)
}

// QueryIDWithStatus executes a mutation/delete query returning (status_code int, data jsonb_or_id),
// checks against StatusErrorMap, and extracts the ID string.
func QueryIDWithStatus(
	ctx context.Context,
	pool *pgxpool.Pool,
	sqlQuery string,
	errMap StatusErrorMap,
	args ...any,
) (string, error) {
	var statusFlag int
	var rawData []byte

	err := pool.QueryRow(ctx, sqlQuery, args...).Scan(&statusFlag, &rawData)
	if err != nil {
		return "", MapPgError(err)
	}

	if mappedErr, ok := errMap[statusFlag]; ok {
		return "", mappedErr
	}

	if len(rawData) == 0 || string(rawData) == "null" {
		return "", nil
	}

	var deletedObj struct {
		ID string `json:"id"`
	}
	if err := json.Unmarshal(rawData, &deletedObj); err == nil && deletedObj.ID != "" {
		return deletedObj.ID, nil
	}

	return string(rawData), nil
}

// QueryStatusOnly executes a query returning only (status_code int) and checks against StatusErrorMap.
func QueryStatusOnly(
	ctx context.Context,
	pool *pgxpool.Pool,
	sqlQuery string,
	errMap StatusErrorMap,
	args ...any,
) error {
	var statusCode int
	err := pool.QueryRow(ctx, sqlQuery, args...).Scan(&statusCode)
	if err != nil {
		return MapPgError(err)
	}

	if mappedErr, ok := errMap[statusCode]; ok {
		return mappedErr
	}

	return nil
}

// DecodeJSON safely deserializes raw JSON bytes into *T.
func DecodeJSON[T any](raw []byte) (*T, error) {
	if len(raw) == 0 || string(raw) == "null" {
		return nil, nil
	}

	var output T
	if err := json.Unmarshal(raw, &output); err != nil {
		return nil, fmt.Errorf("failed to deserialize database JSONB: %w", err)
	}

	return &output, nil
}

// DecodeJSONSlice safely deserializes raw JSON bytes into []T, returning a non-nil empty slice on empty data.
func DecodeJSONSlice[T any](raw []byte) ([]T, error) {
	if len(raw) == 0 || string(raw) == "null" {
		return []T{}, nil
	}

	var output []T
	if err := json.Unmarshal(raw, &output); err != nil {
		return nil, fmt.Errorf("failed to deserialize database JSONB slice: %w", err)
	}

	if output == nil {
		output = []T{}
	}

	return output, nil
}

// Condition pairs a boolean guard condition with an error to return if condition is true (failed).
type Condition struct {
	Failed bool
	Err    error
}

// CheckConditions evaluates each condition sequentially and returns the first error whose Failed flag is true.
func CheckConditions(conds ...Condition) error {
	for _, c := range conds {
		if c.Failed {
			return c.Err
		}
	}
	return nil
}
