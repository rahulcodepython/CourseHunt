-- Trigger: update reply_count on parent when a reply is posted or deleted
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
