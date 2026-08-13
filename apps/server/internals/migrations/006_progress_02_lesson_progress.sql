BEGIN;

CREATE TABLE IF NOT EXISTS lesson_progress (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
    lesson_id   UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    course_id   UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    completed   BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    UNIQUE(user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_course ON lesson_progress(user_id, course_id);

-- Trigger: increment chapter_progress on lesson completion
CREATE OR REPLACE FUNCTION update_chapter_progress_on_lesson_complete() RETURNS TRIGGER AS $$
DECLARE
    v_chapter_id         UUID;
    v_chapter_lesson_cnt INTEGER;
    v_completed_lessons  INTEGER;
BEGIN
    IF (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.completed = true AND (OLD.completed IS DISTINCT FROM true))) THEN
        SELECT chapter_id INTO v_chapter_id FROM lessons WHERE id = NEW.lesson_id;
        INSERT INTO chapter_progress(user_id, chapter_id, course_id, lessons_completed, completed)
        VALUES (NEW.user_id, v_chapter_id, NEW.course_id, 1, false)
        ON CONFLICT (user_id, chapter_id) DO UPDATE
            SET lessons_completed = chapter_progress.lessons_completed + 1;
        SELECT total_lectures INTO v_chapter_lesson_cnt FROM chapters WHERE id = v_chapter_id;
        SELECT lessons_completed INTO v_completed_lessons FROM chapter_progress WHERE user_id = NEW.user_id AND chapter_id = v_chapter_id;
        IF v_chapter_lesson_cnt > 0 AND v_completed_lessons >= v_chapter_lesson_cnt THEN
            UPDATE chapter_progress SET completed = true WHERE user_id = NEW.user_id AND chapter_id = v_chapter_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_chapter_progress ON lesson_progress;
CREATE TRIGGER trg_chapter_progress
    AFTER INSERT OR UPDATE ON lesson_progress
    FOR EACH ROW EXECUTE FUNCTION update_chapter_progress_on_lesson_complete();

COMMIT;
