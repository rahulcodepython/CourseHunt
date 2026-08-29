-- Best-effort reversal. The up migration permanently DELETEd the
-- admin:dashboard/tutor:dashboard/user:dashboard and every user:*
-- permission row, plus the original admin/tutor/user system roles' exact
-- permission bundles — none of that is recoverable from the current
-- database state. This down migration restores the *shape* (the three
-- system role rows exist again, empty) and removes the bootstrap
-- "Super Admin" role this migration created, but does not attempt to
-- recreate deleted permissions or re-populate role_permissions for the
-- restored roles.

-- ============================================================
-- Reverse step 3: recreate empty admin/tutor/user system roles.
-- ============================================================
INSERT INTO roles (name, description, is_system)
VALUES
    ('admin', 'Legacy system role restored by migration rollback.', true),
    ('tutor', 'Legacy system role restored by migration rollback.', true),
    ('user', 'Legacy system role restored by migration rollback.', true)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- Reverse step 2: remove the bootstrap "Super Admin" role and its grants.
-- ============================================================
DELETE FROM roles_user WHERE role_id = (SELECT id FROM roles WHERE name = 'Super Admin');
DELETE FROM role_permissions WHERE role_id = (SELECT id FROM roles WHERE name = 'Super Admin');
DELETE FROM roles WHERE name = 'Super Admin';

-- ============================================================
-- Reverse step 1: cannot restore deleted permission rows (their
-- descriptions were discarded). No-op, documented above.
-- ============================================================
