-- Best-effort reversal of the 000044 data migration. This migration
-- collapsed a UUID-keyed permissions table into a text-keyed one and
-- deleted the 'enrolled' role, both of which discard information
-- (original permission UUIDs, the exact permission set the 'enrolled'
-- role held). This down migration restores the *shape* of the pre-044
-- schema, not bit-identical data — acceptable for a legacy refactor step.

-- ============================================================
-- Reverse step 5: drop the uniqueness constraints added post-rename.
-- ============================================================
ALTER TABLE IF EXISTS roles_user DROP CONSTRAINT IF EXISTS roles_user_user_role_uq;
ALTER TABLE IF EXISTS role_permissions DROP CONSTRAINT IF EXISTS role_permissions_role_permission_uq;

-- ============================================================
-- Reverse step 4: roles_user -> user_roles
-- ============================================================
ALTER TABLE IF EXISTS roles_user RENAME TO user_roles;

-- ============================================================
-- Reverse the trigger/function drop (recreate assign_enrolled_role,
-- matching 000025's up migration).
-- ============================================================
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

-- ============================================================
-- Reverse step 3: recreate the 'enrolled' role (empty permission set —
-- the permissions it used to hold were merged into 'user' and can no
-- longer be distinguished from 'user's own grants).
-- ============================================================
INSERT INTO roles (name, description, is_system)
VALUES ('enrolled', 'Legacy role restored by migration rollback.', false)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- Reverse step 1: permissions back to UUID id + description shape.
-- New UUIDs are generated (the originals were discarded by the up
-- migration) but every id.name/description pairing is preserved.
-- ============================================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'permissions' AND column_name = 'id' AND data_type = 'text'
    ) THEN
        CREATE TABLE permissions_legacy (
            id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name        TEXT NOT NULL UNIQUE,
            description TEXT
        );
        INSERT INTO permissions_legacy (name, description)
            SELECT id, name FROM permissions;

        ALTER TABLE role_permissions ADD COLUMN IF NOT EXISTS permission_uuid UUID;
        UPDATE role_permissions rp
        SET permission_uuid = pl.id
        FROM permissions_legacy pl
        WHERE pl.name = rp.permission_id;

        ALTER TABLE role_permissions DROP CONSTRAINT IF EXISTS role_permissions_permission_id_fkey;
        ALTER TABLE role_permissions DROP COLUMN IF EXISTS permission_id;
        ALTER TABLE role_permissions RENAME COLUMN permission_uuid TO permission_id;
        ALTER TABLE role_permissions ALTER COLUMN permission_id SET NOT NULL;
        ALTER TABLE role_permissions ADD CONSTRAINT role_permissions_permission_id_fkey
            FOREIGN KEY (permission_id) REFERENCES permissions_legacy(id) ON DELETE CASCADE;

        DROP TABLE permissions;
        ALTER TABLE permissions_legacy RENAME TO permissions;
    END IF;
END $$;
