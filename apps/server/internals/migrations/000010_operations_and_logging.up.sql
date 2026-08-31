CREATE TABLE IF NOT EXISTS notifications (
    id         BIGSERIAL PRIMARY KEY,
    type       TEXT NOT NULL,
    message    TEXT NOT NULL,
    is_admin   BOOLEAN NOT NULL DEFAULT false,
    is_tutor   BOOLEAN NOT NULL DEFAULT false,
    is_student BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS notifications_admin_id_idx ON notifications (id DESC) WHERE is_admin = true;
CREATE INDEX IF NOT EXISTS notifications_tutor_id_idx ON notifications (id DESC) WHERE is_tutor = true;

CREATE TABLE IF NOT EXISTS notification_seen (
    user_id                   UUID PRIMARY KEY REFERENCES "users"(id) ON DELETE CASCADE,
    last_seen_notification_id BIGINT REFERENCES notifications(id) ON DELETE SET NULL,
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS logs (
    id          BIGSERIAL PRIMARY KEY,
    message     TEXT NOT NULL,
    actor_email TEXT,
    success     BOOLEAN NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS logs_id_desc_idx ON logs (id DESC);

CREATE TABLE IF NOT EXISTS security_events (
    id         BIGSERIAL PRIMARY KEY,
    event_type TEXT NOT NULL,
    user_id    UUID REFERENCES "users"(id) ON DELETE SET NULL,
    email      TEXT,
    ip_address TEXT,
    user_agent TEXT,
    path       TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS security_events_type_id_idx ON security_events (event_type, id DESC);
CREATE INDEX IF NOT EXISTS security_events_id_desc_idx ON security_events (id DESC);

CREATE OR REPLACE FUNCTION log_user_login() RETURNS TRIGGER AS $$
DECLARE
    v_email TEXT;
BEGIN
    SELECT email INTO v_email FROM "users" WHERE id = NEW."userId";

    INSERT INTO notifications (type, message, is_admin, is_tutor, is_student)
    VALUES ('login', COALESCE(v_email, 'A user') || ' logged in', true, false, false);

    INSERT INTO logs (message, actor_email, success)
    VALUES (COALESCE(v_email, 'Unknown user') || ' logged in', v_email, true);

    INSERT INTO security_events (event_type, user_id, email, ip_address, user_agent)
    VALUES ('login', NEW."userId", v_email, NEW."ipAddress", NEW."userAgent");

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sessions_login ON "sessions";
CREATE TRIGGER trg_sessions_login
    AFTER INSERT ON "sessions"
    FOR EACH ROW EXECUTE FUNCTION log_user_login();
