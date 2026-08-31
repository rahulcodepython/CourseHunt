DO $$ BEGIN PERFORM cron.unschedule('notifications-retention-cleanup'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('logs-retention-cleanup'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('security-events-retention-cleanup'); EXCEPTION WHEN OTHERS THEN NULL; END $$;

DROP EXTENSION IF EXISTS pg_cron;
