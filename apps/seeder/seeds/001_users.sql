-- 001_users.sql: Seed Users, Better-Auth Credential Accounts, Roles Mapping, and Profiles
-- Roles, permissions, and role_permissions are seeded programmatically by
-- main.go from the repo-root `permissions.json` (see scripts/sync-permissions.mjs).
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Insert Users (2 Admins, 3 Tutors, 7 Students)
-- passwordChangedAt is NULL so every seeded account must change its password on first login.
INSERT INTO "users" (id, name, email, "emailVerified", image, role) VALUES
    (gen_random_uuid(), 'System Admin', 'admin@example.com', true, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80', 'admin'),
    (gen_random_uuid(), 'Lead Admin', 'superadmin@example.com', true, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80', 'admin'),
    (gen_random_uuid(), 'Alex Rivers (Go & Systems Expert)', 'tutor@example.com', true, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80', 'tutor'),
    (gen_random_uuid(), 'Dr. Sarah Smith (Data Science Lead)', 'sarah.smith@example.com', true, 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=250&q=80', 'tutor'),
    (gen_random_uuid(), 'John Doe (Next.js & Frontend Architect)', 'john.doe@example.com', true, 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=250&q=80', 'tutor'),
    (gen_random_uuid(), 'Regular Student', 'user@example.com', true, 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80', 'user'),
    (gen_random_uuid(), 'Alice Vance', 'alice@example.com', true, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80', 'user'),
    (gen_random_uuid(), 'Bob Miller', 'bob@example.com', true, 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=250&q=80', 'user'),
    (gen_random_uuid(), 'Charlie Brown', 'charlie@example.com', true, 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=250&q=80', 'user'),
    (gen_random_uuid(), 'David Wright', 'david@example.com', true, 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=250&q=80', 'user'),
    (gen_random_uuid(), 'Eva Davis', 'eva@example.com', true, 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80', 'user'),
    (gen_random_uuid(), 'Fiona Gallagher', 'fiona@example.com', true, 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=250&q=80', 'user')
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    image = EXCLUDED.image,
    role = EXCLUDED.role,
    "passwordChangedAt" = NULL;

-- Insert Better-Auth Credential Accounts (scrypt hashes, format `<salt>:<key>`)
-- Password hashes match Better-Auth's scrypt params: N=16384, r=16, p=1, dkLen=64
-- Verified against @better-auth/utils' verifyPassword: every account below
-- (admin/tutor and student alike) hashes to "password123". The admin/tutor
-- hashes were regenerated 2026-08-21 — the previous ones in this file did
-- NOT verify against "password123" (or any other tried candidate), so no
-- staff account could actually sign in with the documented password.
INSERT INTO "accounts" ("userId", "accountId", "providerId", "password")
SELECT u.id, v.email, 'credential', v.hash
FROM (VALUES
    ('admin@example.com',  '3e241efba52e84fb56d8151a0467682c:1753d5e567d005f8fd62e6315225656442edd6d1a18ba6aee7d17961b350ce688d341b30c9cb748b6516354b189281315bc39f194fcc6472f8289dc5cb17b389'),
    ('superadmin@example.com', '3e241efba52e84fb56d8151a0467682c:1753d5e567d005f8fd62e6315225656442edd6d1a18ba6aee7d17961b350ce688d341b30c9cb748b6516354b189281315bc39f194fcc6472f8289dc5cb17b389'),
    ('tutor@example.com',  '2cb0733c3a8ef0699f0d5fee0f38fbca:f6e4b51eab9527a3c9c52c9ff5f842adef3cf921f23584d946ab27b8eda1414211de126aecaebb3283bf7b62472f59f6785baf4b0c4053b1240c42f357be1efd'),
    ('sarah.smith@example.com', '2cb0733c3a8ef0699f0d5fee0f38fbca:f6e4b51eab9527a3c9c52c9ff5f842adef3cf921f23584d946ab27b8eda1414211de126aecaebb3283bf7b62472f59f6785baf4b0c4053b1240c42f357be1efd'),
    ('john.doe@example.com', '2cb0733c3a8ef0699f0d5fee0f38fbca:f6e4b51eab9527a3c9c52c9ff5f842adef3cf921f23584d946ab27b8eda1414211de126aecaebb3283bf7b62472f59f6785baf4b0c4053b1240c42f357be1efd'),
    ('user@example.com',   '0d515d6ce843e0bb9963f0e0f4b8f59d:e88217fe8195c224a0890884a5b84d8347550b893ad5d200e82e0a9e013541224e69a5ca8b947faa4b0aa21bc6073f2cd7d9f48afbb12245c3a85f9327c6b78a'),
    ('alice@example.com',  '2fc9c5ff7668bbdb273250224f09c0ed:bb5b0d3b555409c39130bb2d57511bb818e095a0d7ea1e338417a44940f7919c9c5867ff2e75c69d2f14a78883f43a0d6f6dd0d7e2d93580d592e76685ae1d90'),
    ('bob@example.com',    '2fc9c5ff7668bbdb273250224f09c0ed:bb5b0d3b555409c39130bb2d57511bb818e095a0d7ea1e338417a44940f7919c9c5867ff2e75c69d2f14a78883f43a0d6f6dd0d7e2d93580d592e76685ae1d90'),
    ('charlie@example.com','2fc9c5ff7668bbdb273250224f09c0ed:bb5b0d3b555409c39130bb2d57511bb818e095a0d7ea1e338417a44940f7919c9c5867ff2e75c69d2f14a78883f43a0d6f6dd0d7e2d93580d592e76685ae1d90'),
    ('david@example.com',  '2fc9c5ff7668bbdb273250224f09c0ed:bb5b0d3b555409c39130bb2d57511bb818e095a0d7ea1e338417a44940f7919c9c5867ff2e75c69d2f14a78883f43a0d6f6dd0d7e2d93580d592e76685ae1d90'),
    ('eva@example.com',    '2fc9c5ff7668bbdb273250224f09c0ed:bb5b0d3b555409c39130bb2d57511bb818e095a0d7ea1e338417a44940f7919c9c5867ff2e75c69d2f14a78883f43a0d6f6dd0d7e2d93580d592e76685ae1d90'),
    ('fiona@example.com',  '2fc9c5ff7668bbdb273250224f09c0ed:bb5b0d3b555409c39130bb2d57511bb818e095a0d7ea1e338417a44940f7919c9c5867ff2e75c69d2f14a78883f43a0d6f6dd0d7e2d93580d592e76685ae1d90')
) AS v(email, hash)
JOIN "users" u ON u.email = v.email
ON CONFLICT ("providerId", "accountId") DO NOTHING;

-- Bootstrap admin access: plain data, no hardcoded "super admin" role
-- concept. An "Admin" role holding every admin:* permission is created here
-- directly from whatever's actually in the permissions table (so it never
-- drifts from permissions.json), and assigned to the seeded admin accounts.
-- Being a "super admin" is just the property of holding every admin
-- permission — not a distinct role type. Tutor and plain user accounts get
-- no roles_user row at all (tutor capabilities are modular, granted later
-- via /roles; plain users don't participate in the permission system).
INSERT INTO roles (name, description, is_system)
VALUES ('Super Admin', 'Full administrative access — every admin:* permission.', true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT (SELECT id FROM roles WHERE name = 'Super Admin'), p.id
FROM permissions p
WHERE p.id LIKE 'admin:%'
ON CONFLICT DO NOTHING;

DELETE FROM roles_user WHERE user_id IN (
    SELECT id FROM "users" WHERE email IN ('admin@example.com', 'superadmin@example.com')
);

INSERT INTO roles_user (user_id, role_id)
SELECT u.id, (SELECT id FROM roles WHERE name = 'Super Admin')
FROM "users" u
WHERE u.role = 'admin'
ON CONFLICT DO NOTHING;

-- Insert User Profiles (Merged single `profiles` table)
INSERT INTO profiles (user_id, bio, headline, website, total_students, rating_avg)
SELECT u.id, v.bio, v.headline, v.website, v.total_students, v.rating_avg
FROM (VALUES
    ('admin@example.com', 'Platform Administrator managing operations and course quality.', 'CourseHunt Platform Admin', 'https://coursehunt.com', 0, 0),
    ('superadmin@example.com', 'Operations & System Security Lead at CourseHunt.', 'Senior Admin', 'https://coursehunt.com', 0, 0),
    ('tutor@example.com', 'Alex Rivers is a veteran software architect who has led Go microservices transformations at scale.', 'Go & Microservices Architect', 'https://alexrivers.dev', 120, 4.90),
    ('sarah.smith@example.com', 'Dr. Sarah Smith holds a PhD from MIT and brings real-world AI research experience into interactive, easy-to-grasp courses.', 'AI & Data Science Instructor', 'https://sarahsmith.ai', 85, 4.95),
    ('john.doe@example.com', 'John Doe is a Next.js Core Contributor and UI design advocate focused on clean code, performance, and accessibility.', 'Principal Frontend Engineer', 'https://johndoe.codes', 95, 4.85),
    ('user@example.com', 'Passionate learner exploring Go backend engineering and modern web technologies.', 'Software Developer', NULL, 0, 0),
    ('alice@example.com', 'Computer Science student focusing on Frontend engineering.', 'CS Undergrad', NULL, 0, 0),
    ('bob@example.com', 'Self-taught developer building full-stack applications.', 'Junior Web Developer', NULL, 0, 0),
    ('charlie@example.com', 'DevOps enthusiast transitioning into Cloud Native engineering.', 'Junior Systems Engineer', NULL, 0, 0),
    ('david@example.com', 'Data enthusiast learning Python & AI models.', 'Data Analyst', NULL, 0, 0),
    ('eva@example.com', 'UI/UX Designer expanding into React and Next.js frontend development.', 'Product Designer', NULL, 0, 0),
    ('fiona@example.com', 'Mobile app developer learning Flutter and React Native.', 'App Developer', NULL, 0, 0)
) AS v(email, bio, headline, website, total_students, rating_avg)
JOIN users u ON u.email = v.email
ON CONFLICT (user_id) DO UPDATE SET bio = EXCLUDED.bio, headline = EXCLUDED.headline, website = EXCLUDED.website;