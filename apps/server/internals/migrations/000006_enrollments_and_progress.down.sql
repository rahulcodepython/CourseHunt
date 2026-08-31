DROP TRIGGER IF EXISTS trg_enrollment_completion ON chapter_progress;
DROP FUNCTION IF EXISTS update_enrollment_completion();
DROP TRIGGER IF EXISTS trg_chapter_progress ON lesson_progress;
DROP FUNCTION IF EXISTS update_chapter_progress_on_lesson_complete();
DROP TABLE IF EXISTS lesson_progress;
DROP TABLE IF EXISTS chapter_progress;
DROP TABLE IF EXISTS enrollments;
