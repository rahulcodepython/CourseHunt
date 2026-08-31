// Package retry provides one shared connect-with-backoff helper so every
// infra connector (postgres, minio, redis) retries the same way instead of
// each hand-rolling its own fixed-attempts loop with a different interval
// and no shared code.
package retry

import (
	"log/slog"
	"time"

	"github.com/cenkalti/backoff/v4"
)

// Connect calls fn up to maxAttempts times with a fixed interval between
// attempts, logging each failed attempt under the given label. It returns
// the last error if every attempt fails, or nil on the first success.
// Callers decide what a final failure means — fail-fast (postgres), a
// soft-fail return (minio), or warn-and-continue (redis); this only unifies
// the retry mechanics, not what happens after they're exhausted.
func Connect(label string, maxAttempts int, interval time.Duration, fn func() error) error {
	attempt := 0
	policy := backoff.WithMaxRetries(backoff.NewConstantBackOff(interval), uint64(maxAttempts-1))

	return backoff.Retry(func() error {
		attempt++
		err := fn()
		if err != nil && attempt < maxAttempts {
			slog.Warn("connection attempt failed, retrying",
				"component", label, "attempt", attempt, "max_attempts", maxAttempts, "error", err, "retry_in", interval)
		}
		return err
	}, policy)
}
