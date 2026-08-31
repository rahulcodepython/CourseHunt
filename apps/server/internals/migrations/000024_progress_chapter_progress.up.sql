CREATE TABLE IF NOT EXISTS chapter_progress (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
    chapter_id        UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    course_id         UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    lessons_completed INTEGER DEFAULT 0,
    completed         BOOLEAN DEFAULT false,
    UNIQUE(user_id, chapter_id)
);

CREATE INDEX IF NOT EXISTS idx_chapter_progress_user_course ON chapter_progress(user_id, course_id);

-- Trigger: recalculate enrollment completion when chapter_progress is updated
CREATE OR REPLACE FUNCTION update_enrollment_completion() RETURNS TRIGGER AS $$
DECLARE
    v_total_chapters   INTEGER;
    v_completed_chaps  INTEGER;
    v_total_lessons    INTEGER;
    v_completed_lessons INTEGER;
    v_pct              DECIMAL(5,2);
BEGIN
    SELECT COUNT(*) INTO v_total_chapters FROM chapters WHERE course_id = NEW.course_id;
    SELECT COUNT(*) INTO v_completed_chaps FROM chapter_progress WHERE user_id = NEW.user_id AND course_id = NEW.course_id AND completed = true;
    SELECT COALESCE(total_lectures,0) INTO v_total_lessons FROM courses WHERE id = NEW.course_id;
    SELECT COUNT(*) INTO v_completed_lessons FROM lesson_progress WHERE user_id = NEW.user_id AND course_id = NEW.course_id AND completed = true;
    IF v_total_lessons > 0 THEN
        v_pct := (v_completed_lessons::DECIMAL / v_total_lessons) * 100;
    ELSE
        v_pct := 0;
    END IF;
    UPDATE enrollments
    SET completion_percent = v_pct,
        completed = (v_total_chapters > 0 AND v_completed_chaps >= v_total_chapters)
    WHERE user_id = NEW.user_id AND course_id = NEW.course_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enrollment_completion ON chapter_progress;
CREATE TRIGGER trg_enrollment_completion
    AFTER UPDATE ON chapter_progress
    FOR EACH ROW EXECUTE FUNCTION update_enrollment_completion();
