-- 001: RBAC — roles, permissions, role_permissions, user_roles

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS roles (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL UNIQUE,
    description TEXT,
    is_system   BOOLEAN NOT NULL DEFAULT false
);

-- ── Seed Roles ────────────────────────────────────────────────────────────────
INSERT INTO roles (name, description, is_system) VALUES
    ('admin',    'Platform administrator with full access', true),
    ('tutor',    'Course instructor and content manager',   true),
    ('user',     'Regular learner',                         true),
    ('enrolled', 'User enrolled in at least one course',    true)
ON CONFLICT (name) DO NOTHING;
