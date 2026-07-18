-- ── Trigger: auto-assign 'user' role on new user; first user → 'admin' ────────
CREATE OR REPLACE FUNCTION assign_default_role() RETURNS TRIGGER AS $$
DECLARE
    user_count     INTEGER;
    target_role_id INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM "user";
    IF user_count = 1 THEN
        SELECT id INTO target_role_id FROM roles WHERE name = 'admin';
    ELSE
        SELECT id INTO target_role_id FROM roles WHERE name = 'user';
    END IF;
    INSERT INTO user_roles (user_id, role_id)
    VALUES (NEW.id, target_role_id)
    ON CONFLICT DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_assign_default_role ON "user";
CREATE TRIGGER trg_assign_default_role
    AFTER INSERT ON "user"
    FOR EACH ROW EXECUTE FUNCTION assign_default_role();
