DROP TRIGGER IF EXISTS trg_enrollment_completion ON chapter_progress;
DROP FUNCTION IF EXISTS update_enrollment_completion();
DROP INDEX IF EXISTS idx_chapter_progress_user_course;
DROP TABLE IF EXISTS chapter_progress;
