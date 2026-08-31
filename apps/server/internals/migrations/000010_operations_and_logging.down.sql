DROP TRIGGER IF EXISTS trg_sessions_login ON "sessions";
DROP FUNCTION IF EXISTS log_user_login();
DROP TABLE IF EXISTS security_events;
DROP TABLE IF EXISTS logs;
DROP TABLE IF EXISTS notification_seen;
DROP TABLE IF EXISTS notifications;
