package postgres

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

// Standard Domain Errors for HTTP Handlers / Controllers
var (
	ErrNotFound     = errors.New("requested resource not found")
	ErrForbidden    = errors.New("access denied for entity")
	ErrInvalidState = errors.New("invalid state machine transition")
	ErrConflict     = errors.New("resource conflict or constraint violation")
	ErrInternalDB   = errors.New("unexpected database error")
)

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
		case "57014": // QUERY CANCELED / STATEMENT TIMEOUT
			return fmt.Errorf("%w: %s", context.DeadlineExceeded, pgErr.Message)
		default:
			return fmt.Errorf("%w [SQLSTATE %s]: %s", ErrInternalDB, pgErr.Code, pgErr.Message)
		}
	}

	return err
}
