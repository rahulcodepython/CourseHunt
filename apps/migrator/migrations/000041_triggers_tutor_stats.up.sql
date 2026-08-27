-- Trigger: increment tutor total_students on new enrollment
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
