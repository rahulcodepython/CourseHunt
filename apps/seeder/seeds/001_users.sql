-- 001_users.sql: Seed Users, Credentials, Roles Mapping, and Profiles
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

-- Insert Credentials (Passwords: admin123456, tutor123456, user123456 / password123)
INSERT INTO credentials (user_id, password_hash, password_changed_at)
SELECT u.id, crypt(v.password, gen_salt('bf', 10)), CURRENT_TIMESTAMP
FROM (VALUES
    ('admin@example.com', 'admin123456', CURRENT_TIMESTAMP),
    ('superadmin@example.com', 'admin123456', CURRENT_TIMESTAMP),
    ('tutor@example.com', 'tutor123456', CURRENT_TIMESTAMP),
    ('sarah.smith@example.com', 'tutor123456', CURRENT_TIMESTAMP),
    ('john.doe@example.com', 'tutor123456', CURRENT_TIMESTAMP),
    ('user@example.com', 'user123456', CURRENT_TIMESTAMP),
    ('alice@example.com', 'password123', CURRENT_TIMESTAMP),
    ('bob@example.com', 'password123', NULL),
    ('charlie@example.com', 'password123', NULL),
    ('david@example.com', 'password123', NULL),
    ('eva@example.com', 'password123', NULL),
    ('fiona@example.com', 'password123', NULL)
) AS v(email, password, password_changed_at)
JOIN users u ON u.email = v.email
ON CONFLICT (user_id) DO UPDATE SET password_hash = EXCLUDED.password_hash;

-- Insert Better-Auth Credential Accounts (scrypt hashes, format `<salt>:<key>`)
-- Password hashes match Better-Auth's scrypt params: N=16384, r=16, p=1, dkLen=64
INSERT INTO "accounts" ("userId", "accountId", "providerId", "password")
SELECT u.id, v.email, 'credential', v.hash
FROM (VALUES
    ('admin@example.com',  '6b2905155c4f85aad3add8f218c21bc8:9897832af325de18682de24cec4a632193b872377d11fcf688921eda23be851f4ed865ce8682390cfe8510933d7ce42fb731ea0f23a1a26e55a23457ff4d67ab'),
    ('superadmin@example.com', '6b2905155c4f85aad3add8f218c21bc8:9897832af325de18682de24cec4a632193b872377d11fcf688921eda23be851f4ed865ce8682390cfe8510933d7ce42fb731ea0f23a1a26e55a23457ff4d67ab'),
    ('tutor@example.com',  '46c022d9752babc3e04d0f40920ce07c:6bf70f61a74a4fd6b1dc6b8b9e920b2af65299a4a4d80df4b5a6b743a037467e5a31ceaf5a282a45759fd35b4d81432aa128ba9218de407947e76e61251ed272'),
    ('sarah.smith@example.com', '46c022d9752babc3e04d0f40920ce07c:6bf70f61a74a4fd6b1dc6b8b9e920b2af65299a4a4d80df4b5a6b743a037467e5a31ceaf5a282a45759fd35b4d81432aa128ba9218de407947e76e61251ed272'),
    ('john.doe@example.com', '46c022d9752babc3e04d0f40920ce07c:6bf70f61a74a4fd6b1dc6b8b9e920b2af65299a4a4d80df4b5a6b743a037467e5a31ceaf5a282a45759fd35b4d81432aa128ba9218de407947e76e61251ed272'),
    ('user@example.com',   'e91fc7fa0e5dc589196f0b92fc7c54e6:48f5155a0696d6ecef088d4b0c5ad4524e92af5518a00765e10b1782a8aa81c94bc01ace9b7ed56e5995fc05868a112562d668d862e41b346eeefede5a108a1e'),
    ('alice@example.com',  '2fc9c5ff7668bbdb273250224f09c0ed:bb5b0d3b555409c39130bb2d57511bb818e095a0d7ea1e338417a44940f7919c9c5867ff2e75c69d2f14a78883f43a0d6f6dd0d7e2d93580d592e76685ae1d90'),
    ('bob@example.com',    '2fc9c5ff7668bbdb273250224f09c0ed:bb5b0d3b555409c39130bb2d57511bb818e095a0d7ea1e338417a44940f7919c9c5867ff2e75c69d2f14a78883f43a0d6f6dd0d7e2d93580d592e76685ae1d90'),
    ('charlie@example.com','2fc9c5ff7668bbdb273250224f09c0ed:bb5b0d3b555409c39130bb2d57511bb818e095a0d7ea1e338417a44940f7919c9c5867ff2e75c69d2f14a78883f43a0d6f6dd0d7e2d93580d592e76685ae1d90'),
    ('david@example.com',  '2fc9c5ff7668bbdb273250224f09c0ed:bb5b0d3b555409c39130bb2d57511bb818e095a0d7ea1e338417a44940f7919c9c5867ff2e75c69d2f14a78883f43a0d6f6dd0d7e2d93580d592e76685ae1d90'),
    ('eva@example.com',    '2fc9c5ff7668bbdb273250224f09c0ed:bb5b0d3b555409c39130bb2d57511bb818e095a0d7ea1e338417a44940f7919c9c5867ff2e75c69d2f14a78883f43a0d6f6dd0d7e2d93580d592e76685ae1d90'),
    ('fiona@example.com',  '2fc9c5ff7668bbdb273250224f09c0ed:bb5b0d3b555409c39130bb2d57511bb818e095a0d7ea1e338417a44940f7919c9c5867ff2e75c69d2f14a78883f43a0d6f6dd0d7e2d93580d592e76685ae1d90')
) AS v(email, hash)
JOIN "users" u ON u.email = v.email
ON CONFLICT ("providerId", "accountId") DO NOTHING;

-- Map User Roles (users.role is authoritative: admin/tutor/user)
DELETE FROM roles_user WHERE user_id IN (
    SELECT id FROM "users" WHERE email IN (
        'admin@example.com', 'superadmin@example.com',
        'tutor@example.com', 'sarah.smith@example.com', 'john.doe@example.com',
        'user@example.com', 'alice@example.com', 'bob@example.com',
        'charlie@example.com', 'david@example.com', 'eva@example.com', 'fiona@example.com'
    )
);

INSERT INTO roles_user (user_id, role_id)
SELECT u.id, r.id
FROM "users" u
JOIN roles r ON r.name = u.role
WHERE u.role IN ('admin', 'tutor', 'user')
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