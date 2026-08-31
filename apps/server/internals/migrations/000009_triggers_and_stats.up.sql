-- 1. Chapter stats rollup from lessons
CREATE OR REPLACE FUNCTION update_chapter_stats() RETURNS TRIGGER AS $$
DECLARE
    v_chapter_id UUID;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_chapter_id := OLD.chapter_id;
    ELSE
        v_chapter_id := NEW.chapter_id;
    END IF;
    UPDATE chapters SET
        total_lectures         = (SELECT COUNT(*) FROM lessons WHERE chapter_id = v_chapter_id),
        total_duration_seconds = (SELECT COALESCE(SUM(duration_seconds),0) FROM lessons WHERE chapter_id = v_chapter_id),
        updated_at             = CURRENT_TIMESTAMP
    WHERE id = v_chapter_id;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_chapter_stats ON lessons;
CREATE TRIGGER trg_chapter_stats
    AFTER INSERT OR UPDATE OR DELETE ON lessons
    FOR EACH ROW EXECUTE FUNCTION update_chapter_stats();

-- 2. Course stats rollup from chapters
CREATE OR REPLACE FUNCTION update_course_stats() RETURNS TRIGGER AS $$
DECLARE
    v_course_id UUID;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_course_id := OLD.course_id;
    ELSE
        v_course_id := NEW.course_id;
    END IF;
    UPDATE courses SET
        total_lectures         = (SELECT COALESCE(SUM(total_lectures),0) FROM chapters WHERE course_id = v_course_id),
        total_duration_seconds = (SELECT COALESCE(SUM(total_duration_seconds),0) FROM chapters WHERE course_id = v_course_id),
        updated_at             = CURRENT_TIMESTAMP
    WHERE id = v_course_id;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_course_stats ON chapters;
CREATE TRIGGER trg_course_stats
    AFTER INSERT OR UPDATE OR DELETE ON chapters
    FOR EACH ROW EXECUTE FUNCTION update_course_stats();

-- 3. Course rating and feedback count rollup from feedbacks
CREATE OR REPLACE FUNCTION update_course_rating() RETURNS TRIGGER AS $$
BEGIN
    UPDATE courses SET
        rating_avg     = COALESCE((SELECT AVG(rating) FROM feedbacks WHERE course_id = NEW.course_id), 0),
        feedback_count = (SELECT COUNT(*) FROM feedbacks WHERE course_id = NEW.course_id)
    WHERE id = NEW.course_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_course_rating ON feedbacks;
CREATE TRIGGER trg_course_rating
    AFTER INSERT OR UPDATE ON feedbacks
    FOR EACH ROW EXECUTE FUNCTION update_course_rating();

-- 4. Tutor total_students rollup from enrollments
CREATE OR REPLACE FUNCTION update_tutor_stats() RETURNS TRIGGER AS $$
BEGIN
    UPDATE profiles SET total_students = total_students + 1
    WHERE user_id = (SELECT tutor_id FROM courses WHERE id = NEW.course_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tutor_stats ON enrollments;
CREATE TRIGGER trg_tutor_stats
    AFTER INSERT ON enrollments
    FOR EACH ROW EXECUTE FUNCTION update_tutor_stats();

-- 5. Discussion reply count rollup
CREATE OR REPLACE FUNCTION update_discussion_reply_count() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.parent_id IS NOT NULL THEN
            UPDATE discussions SET reply_count = reply_count + 1 WHERE id = NEW.parent_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.parent_id IS NOT NULL THEN
            UPDATE discussions SET reply_count = GREATEST(reply_count - 1, 0) WHERE id = OLD.parent_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_discussion_reply_count ON discussions;
CREATE TRIGGER trg_discussion_reply_count
    AFTER INSERT OR DELETE ON discussions
    FOR EACH ROW EXECUTE FUNCTION update_discussion_reply_count();
