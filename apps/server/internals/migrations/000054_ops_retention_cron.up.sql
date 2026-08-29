-- Daily 6-month retention cleanup for notifications/logs/security_events,
-- scheduled directly in Postgres via pg_cron.
--
-- REQUIRES: your Postgres server must already have
-- `shared_preload_libraries = 'pg_cron'` set (postgresql.conf) and the
-- server restarted — this is a server-level setting that CANNOT be turned
-- on from a plain migration/CREATE EXTENSION call. docker-compose.yml's
-- postgres service (built from infra/postgres) sets this already.
--
-- cron.schedule() with a named job upserts by name, so re-running this file
-- is safe.

CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
    'notifications-retention-cleanup',
    '0 3 * * *',
    $$DELETE FROM notifications WHERE created_at < NOW() - INTERVAL '6 months'$$
);

SELECT cron.schedule(
    'logs-retention-cleanup',
    '5 3 * * *',
    $$DELETE FROM logs WHERE created_at < NOW() - INTERVAL '6 months'$$
);

SELECT cron.schedule(
    'security-events-retention-cleanup',
    '10 3 * * *',
    $$DELETE FROM security_events WHERE created_at < NOW() - INTERVAL '6 months'$$
);
