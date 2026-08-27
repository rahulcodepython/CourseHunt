-- Audit trail for almost every mutating request (GET requests are exempt).
-- Populated centrally by the extended LoggerMiddleware, not by individual
-- repositories — see internals/middlewares/logger.go.

CREATE TABLE IF NOT EXISTS logs (
    id          BIGSERIAL PRIMARY KEY,
    message     TEXT NOT NULL,
    actor_email TEXT, -- NULL for unauthenticated/public requests
    success     BOOLEAN NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS logs_id_desc_idx ON logs (id DESC);
