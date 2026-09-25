DROP TABLE IF EXISTS assignment_submissions CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS tutor_payout_transactions CASCADE;
DROP TABLE IF EXISTS tutor_payout_profiles CASCADE;

ALTER TABLE chapters
    DROP COLUMN IF EXISTS prerequisite_chapter_id,
    DROP COLUMN IF EXISTS unlock_at,
    DROP COLUMN IF EXISTS unlock_days_after_enrollment;

DROP TABLE IF EXISTS user_learning_streaks CASCADE;

ALTER TABLE lesson_progress
    DROP COLUMN IF EXISTS last_watched_at,
    DROP COLUMN IF EXISTS total_watch_time_seconds,
    DROP COLUMN IF EXISTS playback_seconds;
