package postgres

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

// QueryJSON executes a query that returns a single JSONB document
// and deserializes it directly into the domain type T.
func QueryJSON[T interface{}](
	ctx context.Context,
	pool *pgxpool.Pool,
	sqlQuery string,
	args ...interface{},
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
func QueryJSONSlice[T interface{}](
	ctx context.Context,
	pool *pgxpool.Pool,
	sqlQuery string,
	args ...interface{},
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
	args ...interface{},
) error {
	_, err := pool.Exec(ctx, sqlQuery, args...)
	return MapPgError(err)
}

// StatusErrorMap maps non-success status codes (e.g., 0, 1, 3) to domain errors.
type StatusErrorMap map[int]error

// QueryWithStatus executes a query returning (status_code int, json_data jsonb),
// checks against the provided StatusErrorMap, and deserializes json_data into *T.
func QueryWithStatus[T interface{}](
	ctx context.Context,
	pool *pgxpool.Pool,
	sqlQuery string,
	errMap StatusErrorMap,
	args ...interface{},
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
func QuerySliceWithStatus[T interface{}](
	ctx context.Context,
	pool *pgxpool.Pool,
	sqlQuery string,
	errMap StatusErrorMap,
	args ...interface{},
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
	args ...interface{},
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
	args ...interface{},
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
func DecodeJSON[T interface{}](raw []byte) (*T, error) {
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
func DecodeJSONSlice[T interface{}](raw []byte) ([]T, error) {
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
