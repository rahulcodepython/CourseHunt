-- 006: Progress & Enrollment tables

CREATE TABLE IF NOT EXISTS enrollments (
    id                    text PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    course_id             text NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    completion_percent    DECIMAL(5,2) DEFAULT 0,
    completed             boolean DEFAULT false,
    last_accessed_lesson_id text REFERENCES lessons(id) ON DELETE SET NULL,
    revoked               boolean DEFAULT false,
    enrolled_at           timestamptz DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_user_id   ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_revoked   ON enrollments(revoked);

CREATE TABLE IF NOT EXISTS lesson_progress (
    id          text PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    lesson_id   text NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    course_id   text NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    completed   boolean DEFAULT false,
    completed_at timestamptz,
    UNIQUE(user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_course ON lesson_progress(user_id, course_id);

CREATE TABLE IF NOT EXISTS chapter_progress (
    id                text PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    chapter_id        text NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    course_id         text NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    lessons_completed INTEGER DEFAULT 0,
    completed         boolean DEFAULT false,
    UNIQUE(user_id, chapter_id)
);

CREATE INDEX IF NOT EXISTS idx_chapter_progress_user_course ON chapter_progress(user_id, course_id);

-- Trigger: increment chapter_progress on lesson completion
CREATE OR REPLACE FUNCTION update_chapter_progress_on_lesson_complete() RETURNS TRIGGER AS $$
DECLARE
    v_chapter_id         text;
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
