-- 009: Course stats triggers (chapter, lesson counts)

BEGIN;

-- Trigger: update chapter stats when lessons change
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

COMMIT;
