-- 013: RBAC segment/entitlement split
--
-- Segment (admin/tutor/user) now lives purely on users.role (the better-auth
-- field) and no longer needs a matching row in `roles`. The old pre-seeded
-- `admin`/`tutor`/`user` system roles (each bundling a large default
-- permission set) are removed. In their place:
--   - A plain "Admin" role (is_system) is created holding every admin:*
--     permission that still exists in the catalog after this migration,
--     assigned to every existing admin-segment account so no currently-
--     working admin gets locked out. This isn't a special "super admin"
--     concept baked into any schema/code — it's just a role, built from
--     whatever's actually in the `permissions` table (LIKE 'admin:%'), same
--     mechanism any admin could use to build another role via /roles.
--   - Tutor capabilities become fully modular: no bootstrap tutor role.
--   - Plain `user` accounts no longer participate in the permission system
--     at all: all user:* permissions are dropped.
--   - admin:dashboard / tutor:dashboard / user:dashboard are dropped —
--     dashboard access is now guaranteed by segment, not a permission.
--
-- Guards make this safe both on fresh databases (already at the new shape
-- via apps/seeder) and on existing databases running the old shape.

BEGIN;

-- ============================================================
-- 1. Drop dashboard permissions (guaranteed by segment now) and every
--    user:* permission (plain users no longer use the permission system) —
--    done first so the bootstrap role below never picks these up.
-- ============================================================
DELETE FROM permissions WHERE id IN ('admin:dashboard', 'tutor:dashboard', 'user:dashboard');
DELETE FROM permissions WHERE id LIKE 'user:%';

-- ============================================================
-- 2. Bootstrap a plain "Super Admin" role from whatever admin:* permissions
--    actually exist right now, assigned to every existing admin-segment
--    account so no currently-working admin gets locked out.
-- ============================================================
INSERT INTO roles (name, description, is_system)
VALUES ('Super Admin', 'Full administrative access — every admin:* permission.', true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT (SELECT id FROM roles WHERE name = 'Super Admin'), p.id
FROM permissions p
WHERE p.id LIKE 'admin:%'
ON CONFLICT DO NOTHING;

INSERT INTO roles_user (user_id, role_id)
SELECT u.id, (SELECT id FROM roles WHERE name = 'Super Admin')
FROM "users" u
WHERE u.role = 'admin'
ON CONFLICT DO NOTHING;

-- ============================================================
-- 3. Remove the old admin/tutor/user system roles (segment lives on
--    users.role now, not here). Cascades role_permissions/roles_user.
-- ============================================================
DELETE FROM roles WHERE name IN ('admin', 'tutor', 'user') AND is_system = true;

COMMIT;
