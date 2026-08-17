-- 017_ops: operational visibility (notifications, logs, security events).
-- These three tables use a BIGSERIAL id (not UUID, unlike the rest of this
-- schema) on purpose: the frontend feeds page/poll/refresh via cursor
-- pagination ("give me everything after id X"), which only works with a
-- strictly monotonic id — a random UUID carries no ordering information.

BEGIN;

CREATE TABLE IF NOT EXISTS notifications (
    id         BIGSERIAL PRIMARY KEY,
    type       TEXT NOT NULL, -- login | purchase | discussion | feedback | system_error
    message    TEXT NOT NULL,
    is_admin   BOOLEAN NOT NULL DEFAULT false,
    is_tutor   BOOLEAN NOT NULL DEFAULT false,
    is_student BOOLEAN NOT NULL DEFAULT false, -- unused today, reserved for future student-facing notifications
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS notifications_admin_id_idx ON notifications (id DESC) WHERE is_admin = true;
CREATE INDEX IF NOT EXISTS notifications_tutor_id_idx ON notifications (id DESC) WHERE is_tutor = true;

COMMIT;
