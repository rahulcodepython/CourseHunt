DROP TRIGGER IF EXISTS trg_course_rating ON feedbacks;
DROP FUNCTION IF EXISTS update_course_rating();
DROP INDEX IF EXISTS idx_feedbacks_is_pinned;
DROP INDEX IF EXISTS idx_feedbacks_course_id;
DROP TABLE IF EXISTS feedbacks;
