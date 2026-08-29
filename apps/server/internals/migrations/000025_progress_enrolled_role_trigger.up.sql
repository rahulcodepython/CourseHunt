-- ── Trigger: auto-assign 'enrolled' role when a user enrolls in a course ──────
CREATE OR REPLACE FUNCTION assign_enrolled_role() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_roles (user_id, role_id)
    SELECT NEW.user_id, id FROM roles WHERE name = 'enrolled'
    ON CONFLICT DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_assign_enrolled_role ON enrollments;
CREATE TRIGGER trg_assign_enrolled_role
    AFTER INSERT ON enrollments
    FOR EACH ROW EXECUTE FUNCTION assign_enrolled_role();
