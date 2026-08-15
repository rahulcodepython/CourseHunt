-- 012: RBAC refactor + forced password change
--
-- 1. users.passwordChangedAt  -> NULL means the user must change password on next login
-- 2. permissions table        -> id = machine key ("admin:users:list"), name = human-readable
-- 3. enrolled:* permissions   -> merged into user:* (and dropped from the user role's view)
-- 4. 'enrolled' role          -> removed (its permissions are absorbed by the 'user' role)
-- 5. user_roles               -> renamed to roles_user
--
-- Guards make this safe both on fresh databases (001_rbac_* already at final shape)
-- and on existing databases (legacy shape).

BEGIN;

-- ============================================================
-- 1. users.passwordChangedAt
-- ============================================================
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "passwordChangedAt" TIMESTAMPTZ;

-- ============================================================
-- 2. permissions table -> id (TEXT key) + name (human readable)
--    Only runs when the legacy uuid+description shape is detected.
-- ============================================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'permissions' AND column_name = 'description'
    ) THEN
        -- Permissions with no human description fall back to their key.
        CREATE TABLE permissions_new (
            id   TEXT PRIMARY KEY,
            name TEXT NOT NULL
        );
        INSERT INTO permissions_new (id, name)
            SELECT name, COALESCE(NULLIF(description, ''), name)
            FROM permissions;

        -- Remap role_permissions from the old uuid permission_id to the new text key.
        ALTER TABLE role_permissions ADD COLUMN IF NOT EXISTS permission_key TEXT;
        UPDATE role_permissions rp
        SET permission_key = pn.id
        FROM permissions p
        JOIN permissions_new pn ON pn.id = p.name
        WHERE p.id = rp.permission_id;

        ALTER TABLE role_permissions DROP CONSTRAINT IF EXISTS role_permissions_permission_id_fkey;
        ALTER TABLE role_permissions DROP COLUMN IF EXISTS permission_id;
        ALTER TABLE role_permissions RENAME COLUMN permission_key TO permission_id;
        ALTER TABLE role_permissions ALTER COLUMN permission_id SET NOT NULL;

        DROP TABLE permissions;
        ALTER TABLE permissions_new RENAME TO permissions;

        -- enrolled:* -> user:* (safe here: the FK on role_permissions is still dropped)
        UPDATE permissions SET id = 'user:' || substr(id, 10) WHERE id LIKE 'enrolled:%';
        UPDATE role_permissions SET permission_id = 'user:' || substr(permission_id, 10)
            WHERE permission_id LIKE 'enrolled:%';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'role_permissions_permission_id_fkey') THEN
        ALTER TABLE role_permissions ADD CONSTRAINT role_permissions_permission_id_fkey
            FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE;
    END IF;
END $$;

-- ============================================================
-- 4. Remove the 'enrolled' role, absorbing its permissions into 'user'
-- ============================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM roles WHERE name = 'enrolled') THEN
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT u.id, e.permission_id
        FROM roles u
        CROSS JOIN role_permissions e
        WHERE u.name = 'user'
          AND e.role_id = (SELECT id FROM roles WHERE name = 'enrolled')
        ON CONFLICT DO NOTHING;

        DELETE FROM user_roles WHERE role_id = (SELECT id FROM roles WHERE name = 'enrolled');
        DELETE FROM role_permissions WHERE role_id = (SELECT id FROM roles WHERE name = 'enrolled');
        DELETE FROM roles WHERE name = 'enrolled';
    END IF;
END $$;

-- The auto-assign-enrolled-role trigger is obsolete (users keep the 'user' role).
DROP TRIGGER IF EXISTS trg_assign_enrolled_role ON enrollments;
DROP FUNCTION IF EXISTS assign_enrolled_role();

-- ============================================================
-- 5. user_roles -> roles_user
-- ============================================================
ALTER TABLE IF EXISTS user_roles RENAME TO roles_user;

-- ============================================================
-- 6. Unique mappings (fixes duplicate rows from re-runs and makes
--    the seeder's ON CONFLICT DO NOTHING meaningful)
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'role_permissions_role_permission_uq') THEN
        DELETE FROM role_permissions rp
        USING role_permissions rp2
        WHERE rp.role_id = rp2.role_id
          AND rp.permission_id = rp2.permission_id
          AND rp.ctid < rp2.ctid;

        ALTER TABLE role_permissions ADD CONSTRAINT role_permissions_role_permission_uq
            UNIQUE (role_id, permission_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'roles_user_user_role_uq') THEN
        DELETE FROM roles_user ru
        USING roles_user ru2
        WHERE ru.user_id = ru2.user_id
          AND ru.role_id = ru2.role_id
          AND ru.ctid < ru2.ctid;

        ALTER TABLE roles_user ADD CONSTRAINT roles_user_user_role_uq
            UNIQUE (user_id, role_id);
    END IF;
END $$;

COMMIT;