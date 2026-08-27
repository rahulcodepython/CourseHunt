-- Trigger: update course stats when chapters change
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
