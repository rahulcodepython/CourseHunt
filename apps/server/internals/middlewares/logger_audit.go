package middlewares

import (
	"context"
	"log/slog"
	"sync"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Audit rows are written by a small fixed pool of workers instead of a
// goroutine per request — under a traffic spike or a slow DB, spawning one
// goroutine per request has no upper bound and amplifies the outage instead
// of shedding load. The queue is a bounded buffer; a full queue drops the
// row (audit logging is best-effort and must never add request latency)
// rather than blocking the caller.
const (
	auditWorkerCount = 8
	auditQueueSize   = 512
)

type auditJob struct {
	db                               *pgxpool.Pool
	method, routePath, ip, userAgent string
	status                           int
	userID                           *string
	logMessage, notifMessage         string
}

var (
	auditQueue     chan auditJob
	auditQueueOnce sync.Once
)

func startAuditWorkers() {
	auditQueue = make(chan auditJob, auditQueueSize)
	for range auditWorkerCount {
		go func() {
			for job := range auditQueue {
				execAuditRow(job)
			}
		}()
	}
}

func execAuditRow(j auditJob) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := j.db.Exec(ctx, `
		WITH actor AS (
			SELECT u.email FROM (SELECT $3::uuid AS uid) p
			LEFT JOIN "users" u ON u.id = p.uid
		),
		log_ins AS (
			INSERT INTO logs (message, actor_email, success)
			SELECT $1, actor.email, $2 FROM actor WHERE $4
		),
		notif_ins AS (
			INSERT INTO notifications (type, message, is_admin, is_tutor, is_student)
			SELECT 'system_error', $5, true, false, false WHERE $6 >= 500
		),
		sec_ins AS (
			INSERT INTO security_events (event_type, user_id, email, ip_address, user_agent, path)
			SELECT
				CASE WHEN $6 = 429 THEN 'rate_limit_exceeded' ELSE 'unauthorized_access' END,
				$3::uuid, actor.email, $7, $8, $9
			FROM actor WHERE $6 IN (401, 403, 429)
		)
		SELECT 1
	`, j.logMessage, j.status < 400, j.userID, j.method != fiber.MethodGet, j.notifMessage, j.status, j.ip, j.userAgent, j.routePath)
	if err != nil {
		slog.Error("audit insert failed", "error", err)
	}
}

// shouldAudit returns whether a request produces any audit log, notification, or security event row.
func shouldAudit(method string, status int) bool {
	return method != fiber.MethodGet || status >= 500 || status == 401 || status == 403 || status == 429
}

// writeAuditRow enqueues the operational audit trail for this request onto the bounded worker pool.
func writeAuditRow(db *pgxpool.Pool, method, routePath string, status int, userID *string, ip, userAgent, logMessage, notifMessage string) {
	if db == nil || auditQueue == nil {
		return
	}

	job := auditJob{db, method, routePath, ip, userAgent, status, userID, logMessage, notifMessage}
	select {
	case auditQueue <- job:
	default:
		slog.Warn("audit queue full, dropping audit row", "method", method, "route", routePath)
	}
}
