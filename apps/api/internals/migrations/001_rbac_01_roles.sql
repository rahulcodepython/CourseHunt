-- 001: RBAC — roles, permissions, role_permissions, user_roles

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS roles (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL UNIQUE,
    description TEXT
);

-- ── Seed Roles ────────────────────────────────────────────────────────────────
INSERT INTO roles (name, description) VALUES
    ('admin',   'Platform administrator with full access'),
    ('tutor',   'Course instructor and content manager'),
    ('user',    'Regular learner')
ON CONFLICT (name) DO NOTHING;
