DROP TRIGGER IF EXISTS trg_chapter_progress ON lesson_progress;
DROP FUNCTION IF EXISTS update_chapter_progress_on_lesson_complete();
DROP INDEX IF EXISTS idx_lesson_progress_user_course;
DROP TABLE IF EXISTS lesson_progress;
