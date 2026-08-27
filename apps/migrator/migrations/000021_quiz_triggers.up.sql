-- Trigger: update total_questions on quiz_metadata after question insert/delete
CREATE OR REPLACE FUNCTION update_quiz_question_count() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE quiz_metadata SET total_questions = total_questions + 1 WHERE id = NEW.quiz_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE quiz_metadata SET total_questions = GREATEST(total_questions - 1, 0) WHERE id = OLD.quiz_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_quiz_question_count ON quiz_questions;
CREATE TRIGGER trg_quiz_question_count
    AFTER INSERT OR DELETE ON quiz_questions
    FOR EACH ROW EXECUTE FUNCTION update_quiz_question_count();
