-- Captures "user login" purely DB-side: better-auth (the Next.js app) never
-- goes through the Go API to create a session, so there's no application
-- code that could hook this event. A new row in "sessions" IS a fresh login
-- (credentials, OAuth, or an admin impersonation via impersonatedBy) — that
-- table already carries ipAddress/userAgent per row, so this single trigger
-- populates notifications, logs, and security_events with zero application
-- round trips, on both the Node and Go sides.

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
