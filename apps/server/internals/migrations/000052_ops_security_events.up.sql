-- Security-relevant events: logins (from the sessions trigger, see
-- 000053_ops_session_triggers.sql), unauthorized access attempts (401/403),
-- and rate-limit hits (429) — the latter two populated by the same extended
-- LoggerMiddleware / RateLimiterMiddleware that populate `logs`.

CREATE TABLE IF NOT EXISTS security_events (
    id         BIGSERIAL PRIMARY KEY,
    event_type TEXT NOT NULL, -- login | unauthorized_access | rate_limit_exceeded
    user_id    UUID REFERENCES "users"(id) ON DELETE SET NULL,
    email      TEXT,
    ip_address TEXT,
    user_agent TEXT,
    path       TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS security_events_type_id_idx ON security_events (event_type, id DESC);
CREATE INDEX IF NOT EXISTS security_events_id_desc_idx ON security_events (id DESC);
