-- Trigger: increment reply_count on parent when a reply is posted
CREATE OR REPLACE FUNCTION update_discussion_reply_count() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.parent_id IS NOT NULL THEN
        UPDATE discussions SET reply_count = reply_count + 1 WHERE id = NEW.parent_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_discussion_reply_count ON discussions;
CREATE TRIGGER trg_discussion_reply_count
    AFTER INSERT ON discussions
    FOR EACH ROW EXECUTE FUNCTION update_discussion_reply_count();
